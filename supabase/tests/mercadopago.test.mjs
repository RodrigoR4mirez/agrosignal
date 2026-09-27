import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { firmaValida } from '../../lib/pagos/firma.ts';

test('firma de avisos de Mercado Pago', () => {
  const secreto = 'secreto-de-prueba', ts = '1790500000', req = 'req-123', id = 'ABC123';
  const v1 = createHmac('sha256', secreto).update(`id:abc123;request-id:${req};ts:${ts};`).digest('hex');
  assert.equal(firmaValida(`ts=${ts},v1=${v1}`, req, id, secreto), true);
  assert.equal(firmaValida(`ts=${ts},v1=${v1}`, req, '999', secreto), false, 'otro pago');
  assert.equal(firmaValida(`ts=${ts},v1=${v1}`, req, id, 'otro-secreto'), false);
  assert.equal(firmaValida(`ts=${ts}`, req, id, secreto), false);
  assert.equal(firmaValida(null, req, id, secreto), false);
  const sinId = createHmac('sha256', secreto).update(`request-id:${req};ts:${ts};`).digest('hex');
  assert.equal(firmaValida(`ts=${ts},v1=${sinId}`, req, null, secreto), true, 'omite lo que no llega');
});

test('cuentas de Mercado Pago y registro de pagos verificados', async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb, email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to anon, authenticated, service_role;
    create schema storage;
    create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text not null, metadata jsonb);
    alter table storage.objects enable row level security;
    grant usage on schema storage to anon, authenticated, service_role;
    grant all on storage.objects to anon, authenticated, service_role;
  `);
  for (const file of (await readdir(new URL('../migrations/', import.meta.url))).filter(f => f.endsWith('.sql')).sort())
    await db.exec(await readFile(new URL(`../migrations/${file}`, import.meta.url), 'utf8'));
  await db.exec('grant usage on schema public to service_role; grant all on all tables in schema public to service_role;');
  const [producer, buyer] = [randomUUID(), randomUUID()];
  for (const [id, rol] of [[producer, 'productor'], [buyer, 'comprador']])
    await db.query('insert into auth.users(id,email,raw_user_meta_data,email_confirmed_at) values($1,$2,$3,now())', [id, `${id}@example.test`, JSON.stringify({ nombre_completo: 'Persona de Prueba', telefono: '999111222', rol, region: 'Piura', cultivo_principal: 'Mango' })]);
  async function as(user, sql, args = [], rol) {
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user ?? '']);
    await db.exec(`set role ${rol ?? (user ? 'authenticated' : 'anon')}`);
    try { return await db.query(sql, args); } finally { await db.exec('reset role'); }
  }
  const lote = randomUUID(), foto = `${producer}/${lote}/${randomUUID()}.jpg`;
  await db.query("insert into storage.objects(bucket_id,name) values('fotos-lotes',$1)", [foto]);
  await db.query("insert into public.lotes(id,productor_id,cultivo,region,provincia,distrito,cantidad_disponible,unidad,precio_unidad,fotos,borrador) values($1,$2,'Mango','Piura','Piura','Castilla',1000,'kg',3,$3,false)", [lote, producer, [foto]]);
  const id = (await as(buyer, "select public.solicitar_compra($1,100,'Av. Grau 100, Piura',$2,3,'envio',null,'antes_envio',null) id", [lote, randomUUID()])).rows[0].id;

  // Los tokens no son visibles para nadie desde la web.
  await db.query("insert into public.cuentas_mercadopago(productor_id,mp_user_id,access_token_cifrado,refresh_token_cifrado,expira_en) values($1,'123','x','y',now()+interval '180 days')", [producer]);
  await assert.rejects(as(producer, 'select * from public.cuentas_mercadopago'), e => e.code === '42501');
  await assert.rejects(as(buyer, 'select * from public.cuentas_mercadopago'), e => e.code === '42501');
  assert.equal((await as(buyer, 'select public.estado_mercadopago($1) e', [producer])).rows[0].e.conectado, true);
  assert.equal((await as(buyer, 'select public.estado_mercadopago($1) e', [buyer])).rows[0].e.conectado, false);

  // Solo el servidor (service_role) registra pagos, y solo con el monto exacto y un acuerdo.
  await assert.rejects(as(buyer, "select public.registrar_pago_mercadopago($1,'555',300)", [id]), e => e.code === '42501');
  await assert.rejects(as(null, "select public.registrar_pago_mercadopago($1,'555',300)", [id], 'service_role'), e => e.code === '22023', 'sin acuerdo todavía');
  await as(producer, "select public.cambiar_estado_pedido($1,'confirmado')", [id]);
  await assert.rejects(as(null, "select public.registrar_pago_mercadopago($1,'555',299)", [id], 'service_role'), e => e.code === '22023');
  await as(null, "select public.registrar_pago_mercadopago($1,'555',300)", [id], 'service_role');
  await as(null, "select public.registrar_pago_mercadopago($1,'555',300)", [id], 'service_role'); // aviso repetido
  const p = (await db.query('select * from public.pedidos where id=$1', [id])).rows[0];
  assert.equal(p.pago_metodo, 'mercado_pago'); assert.equal(p.pago_mp_id, '555'); assert.ok(p.pago_confirmado_en);
  assert.equal((await db.query("select count(*)::int n from public.pedido_eventos where pedido_id=$1 and tipo='pago_confirmado'", [id])).rows[0].n, 1);
  await assert.rejects(as(null, "select public.registrar_pago_mercadopago($1,'556',300)", [id], 'service_role'), e => e.code === '22023', 'un segundo pago');
  // Con el pago confirmado, el productor ya puede despachar.
  await as(producer, "select public.registrar_despacho($1,null,null)", [id]);
  assert.equal((await db.query('select estado from public.pedidos where id=$1', [id])).rows[0].estado, 'enviado');
});

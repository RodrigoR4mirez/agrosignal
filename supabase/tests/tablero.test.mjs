import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';

test('tablero de transacciones: solo admin, cifras y filtro de ejemplos', async (t) => {
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
  const [producer, buyer, admin] = [randomUUID(), randomUUID(), randomUUID()];
  for (const [id, rol] of [[producer, 'productor'], [buyer, 'comprador'], [admin, 'comprador']])
    await db.query('insert into auth.users(id,email,raw_user_meta_data,email_confirmed_at) values($1,$2,$3,now())', [id, `${id}@example.test`, JSON.stringify({ nombre_completo: 'Persona de Prueba', telefono: '999111222', rol, region: 'Piura', cultivo_principal: 'Mango' })]);
  await db.query("update public.perfiles set rol='admin' where id=$1", [admin]);
  async function as(user, sql, args = []) {
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user ?? '']);
    await db.exec(`set role ${user ? 'authenticated' : 'anon'}`);
    try { return await db.query(sql, args); } finally { await db.exec('reset role'); }
  }
  async function lote(descripcion) {
    const id = randomUUID(), foto = `${producer}/${id}/${randomUUID()}.jpg`;
    await db.query("insert into storage.objects(bucket_id,name) values('fotos-lotes',$1)", [foto]);
    await db.query("insert into public.lotes(id,productor_id,cultivo,region,provincia,distrito,cantidad_disponible,unidad,precio_unidad,fotos,borrador,descripcion) values($1,$2,'Mango Kent','Piura','Piura','Castilla',10000,'kg',2,$3,false,$4)", [id, producer, [foto], descripcion]);
    return id;
  }
  const real = await lote('Mango de exportación'), ejemplo = await lote('[Ejemplo] Mango de demostración');
  const pedir = (l, cantidad) => as(buyer, "select public.solicitar_compra($1,$2,'Av. Grau 100, Piura',$3,2,'envio',null,'antes_envio',null) id", [l, cantidad, randomUUID()]).then(r => r.rows[0].id);
  const a = await pedir(real, 1000), b = await pedir(real, 500), c = await pedir(ejemplo, 300);
  await as(producer, "select public.cambiar_estado_pedido($1,'confirmado')", [a]);
  await as(producer, 'select public.confirmar_pago($1)', [a]);
  await as(producer, "select public.cambiar_estado_pedido($1,'rechazado','Sin stock del calibre')", [b]);
  await as(producer, "select public.cambiar_estado_pedido($1,'confirmado')", [c]);

  const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date());
  const tablero = async (reales) => (await as(admin, 'select public.tablero_transacciones($1,$2,$3) t', [hoy, hoy, reales])).rows[0].t;
  await assert.rejects(as(buyer, 'select public.tablero_transacciones($1,$1,false)', [hoy]), e => e.code === '42501');
  await assert.rejects(as(producer, 'select public.tablero_transacciones($1,$1,false)', [hoy]), e => e.code === '42501');
  await assert.rejects(as(admin, "select public.tablero_transacciones($1,'2020-01-01',false)", [hoy]), e => e.code === '22023');

  const todo = await tablero(false);
  assert.equal(todo.kpis.pedidos, 3); assert.equal(todo.kpis.acuerdos, 2); assert.equal(todo.kpis.rechazados, 1);
  assert.equal(Number(todo.kpis.valor_acordado), 2600); assert.equal(Number(todo.kpis.valor_pagado), 2000);
  assert.deepEqual(todo.embudo.map(e => e.n), [3, 2, 1, 0, 0, 0]);
  assert.equal(todo.transacciones.length, 3);
  assert.equal(todo.cultivos[0].nombre, 'Mango');
  const reales = await tablero(true);
  assert.equal(reales.kpis.pedidos, 2); assert.equal(Number(reales.kpis.valor_acordado), 2000);
  assert.ok(reales.transacciones.every(x => !x.ejemplo));
  assert.equal(reales.semanas.length, 1);
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';

test('descuentos por lote y foto de perfil del productor', async (t) => {
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
  for (const file of ['20260926000100_esquema_inicial.sql', '20260926000200_storage.sql', '20260926000300_auth.sql', '20260926000400_marketplace.sql', '20260926000500_transacciones.sql', '20260926000600_sello_inocuidad.sql', '20260926000700_admin_panel.sql', '20260927000100_calificaciones.sql', '20260927000200_descuentos_foto_productor.sql'])
    await db.exec(await readFile(new URL(`../migrations/${file}`, import.meta.url), 'utf8'));

  const [producer, buyer] = [randomUUID(), randomUUID()];
  for (const [id, rol] of [[producer, 'productor'], [buyer, 'comprador']])
    await db.query('insert into auth.users(id,email,raw_user_meta_data,email_confirmed_at) values($1,$2,$3,now())', [id, `${id}@example.test`, JSON.stringify({ nombre_completo: 'Rosa Quispe Mamani', telefono: '999111222', rol, region: 'Piura', cultivo_principal: 'Mango' })]);
  async function as(user, sql, args = []) {
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user ?? '']);
    await db.exec(`set role ${user ? 'authenticated' : 'anon'}`);
    try { return await db.query(sql, args); } finally { await db.exec('reset role'); }
  }
  const lotId = randomUUID(), photo = `${producer}/${lotId}/${randomUUID()}.jpg`;
  await db.query("insert into storage.objects(bucket_id,name) values('fotos-lotes',$1)", [photo]);
  await db.query("insert into public.lotes(id,productor_id,cultivo,region,provincia,distrito,cantidad_disponible,unidad,precio_unidad,fotos,borrador) values($1,$2,'Mango','Piura','Piura','Castilla',1000,'kg',5.00,$3,false)", [lotId, producer, [photo]]);
  const catalog = async () => (await as(null, 'select precio_unidad, precio_anterior, productor_foto from public.catalogo_lotes where id=$1', [lotId])).rows[0];

  // Descuento: solo el dueño, y siempre mayor al precio actual.
  assert.equal((await catalog()).precio_anterior, null);
  await as(producer, 'update public.lotes set precio_anterior=6.25 where id=$1', [lotId]);
  assert.equal(Number((await catalog()).precio_anterior), 6.25);
  await assert.rejects(as(producer, 'update public.lotes set precio_anterior=4.00 where id=$1', [lotId]), e => e.code === '23514');
  await assert.rejects(as(producer, 'update public.lotes set precio_anterior=500 where id=$1', [lotId]), e => e.code === '23514');
  await assert.rejects(as(producer, 'update public.lotes set precio_unidad=7 where id=$1', [lotId]), e => e.code === '23514', 'subir el precio sobre el anterior exige quitar el descuento');
  assert.equal((await as(buyer, 'update public.lotes set precio_anterior=9 where id=$1', [lotId])).affectedRows ?? 0, 0);
  await as(producer, 'update public.lotes set precio_anterior=null where id=$1', [lotId]);
  assert.equal((await catalog()).precio_anterior, null);

  // Foto de perfil: se sube a la carpeta propia y luego se guarda en el perfil.
  const own = `${producer}/${randomUUID()}.jpg`;
  await assert.rejects(as(producer, "insert into storage.objects(bucket_id,name) values('fotos-perfil',$1)", [`${buyer}/${randomUUID()}.jpg`]), e => e.code === '42501');
  await assert.rejects(as(producer, "insert into storage.objects(bucket_id,name) values('fotos-perfil',$1)", [`${producer}/foto.gif`]), e => e.code === '42501');
  await assert.rejects(as(producer, 'update public.perfiles set foto=$1 where id=$2', [own, producer]), e => e.code === '22023', 'la foto debe existir en el bucket');
  await as(producer, "insert into storage.objects(bucket_id,name) values('fotos-perfil',$1)", [own]);
  await as(producer, 'update public.perfiles set foto=$1 where id=$2', [own, producer]);
  assert.equal((await catalog()).productor_foto, own);
  assert.equal((await as(null, 'select public.perfil_productor($1) p', [producer])).rows[0].p.foto, own);

  // Nadie más la cambia, ni se tocan otras columnas del perfil.
  const ajena = `${buyer}/${randomUUID()}.jpg`;
  await as(buyer, "insert into storage.objects(bucket_id,name) values('fotos-perfil',$1)", [ajena]);
  assert.equal((await as(buyer, 'update public.perfiles set foto=$1 where id=$2', [ajena, producer])).affectedRows ?? 0, 0);
  await assert.rejects(as(producer, 'update public.perfiles set foto=$1 where id=$2', [ajena, producer]), e => e.code === '23514');
  await assert.rejects(as(producer, "update public.perfiles set nombre_completo='Otro Nombre' where id=$1", [producer]), e => e.code === '42501');
  await assert.rejects(as(producer, "update public.perfiles set rol='admin' where id=$1", [producer]), e => e.code === '42501');
  await assert.rejects(as(null, 'update public.perfiles set foto=null where id=$1', [producer]), e => e.code === '42501');
  await db.query('update public.perfiles set suspendido=true where id=$1', [producer]);
  assert.equal((await as(producer, 'update public.perfiles set foto=null where id=$1', [producer])).affectedRows ?? 0, 0, 'una cuenta suspendida no cambia su foto');
  assert.equal((await db.query('select foto from public.perfiles where id=$1', [producer])).rows[0].foto, own);
});

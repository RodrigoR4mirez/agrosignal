import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';

test('perfil del productor: finca, ubicación y cifras públicas', async (t) => {
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
  for (const file of ['20260926000100_esquema_inicial.sql', '20260926000200_storage.sql', '20260926000300_auth.sql', '20260926000400_marketplace.sql', '20260926000500_transacciones.sql', '20260926000600_sello_inocuidad.sql', '20260926000700_admin_panel.sql', '20260927000100_calificaciones.sql', '20260927000200_descuentos_foto_productor.sql', '20260927000300_perfil_productor.sql'])
    await db.exec(await readFile(new URL(`../migrations/${file}`, import.meta.url), 'utf8'));

  const [producer, buyer] = [randomUUID(), randomUUID()];
  for (const [id, rol] of [[producer, 'productor'], [buyer, 'comprador']])
    await db.query('insert into auth.users(id,email,raw_user_meta_data,email_confirmed_at) values($1,$2,$3,now())', [id, `${id}@example.test`, JSON.stringify({ nombre_completo: 'Rosa Quispe Mamani', telefono: '999111222', rol, region: 'Cusco', cultivo_principal: 'Papa' })]);
  async function as(user, sql, args = []) {
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user ?? '']);
    await db.exec(`set role ${user ? 'authenticated' : 'anon'}`);
    try { return await db.query(sql, args); } finally { await db.exec('reset role'); }
  }
  const perfil = async () => (await as(null, 'select public.perfil_productor($1) p', [producer])).rows[0].p;
  const check = e => e.code === '23514';

  // El productor completa su perfil.
  await as(producer, `update public.perfiles set finca='Chacra Los Andes', hectareas=4.5, anios_experiencia=22, altitud_msnm=3400,
    latitud=-13.531950, longitud=-71.967463, sobre_mi='Cultivamos papa nativa en andenes.', practicas='{semilla_nativa,cosecha_manual}',
    meses_cosecha='{4,5,6}', capacidad_mensual_kg=8000, entregas='{recojo_en_chacra}', asociacion='Asociación Papa Andina' where id=$1`, [producer]);
  const p = await perfil();
  assert.equal(p.finca, 'Chacra Los Andes');
  assert.equal(Number(p.hectareas), 4.5);
  assert.equal(p.anios_experiencia, 22);
  assert.deepEqual(p.practicas, ['semilla_nativa', 'cosecha_manual']);
  assert.deepEqual(p.meses_cosecha, [4, 5, 6]);
  assert.equal(Number(p.latitud), -13.53195);
  assert.equal(p.ventas_completadas, 0);
  assert.equal(p.lotes_activos, 0);
  assert.equal(p.nivel_maximo, 0);

  // Valores fuera de rango o incompletos se rechazan.
  await assert.rejects(as(producer, 'update public.perfiles set latitud=10, longitud=-75 where id=$1', [producer]), check, 'fuera del Perú');
  await assert.rejects(as(producer, 'update public.perfiles set latitud=null where id=$1', [producer]), check, 'latitud sin longitud');
  await assert.rejects(as(producer, 'update public.perfiles set hectareas=0 where id=$1', [producer]), check);
  await assert.rejects(as(producer, "update public.perfiles set practicas='{inventada}' where id=$1", [producer]), check);
  await assert.rejects(as(producer, "update public.perfiles set meses_cosecha='{13}' where id=$1", [producer]), check);
  await assert.rejects(as(producer, "update public.perfiles set entregas='{a_domicilio}' where id=$1", [producer]), check);
  await assert.rejects(as(producer, `update public.perfiles set sobre_mi=repeat('a', 601) where id=$1`, [producer]), check);

  // Solo el dueño edita, y solo estas columnas.
  assert.equal((await as(buyer, "update public.perfiles set finca='Ajena' where id=$1", [producer])).affectedRows ?? 0, 0);
  await assert.rejects(as(null, "update public.perfiles set finca='Anónima' where id=$1", [producer]), e => e.code === '42501');
  await assert.rejects(as(producer, "update public.perfiles set telefono='000' where id=$1", [producer]), e => e.code === '42501');
  await assert.rejects(as(producer, "update public.perfiles set suspendido=false where id=$1", [producer]), e => e.code === '42501');
  assert.equal((await perfil()).finca, 'Chacra Los Andes');

  // Las cifras públicas cuentan lotes del catálogo.
  const lotId = randomUUID(), photo = `${producer}/${lotId}/${randomUUID()}.jpg`;
  await db.query("insert into storage.objects(bucket_id,name) values('fotos-lotes',$1)", [photo]);
  await db.query("insert into public.lotes(id,productor_id,cultivo,region,provincia,distrito,cantidad_disponible,unidad,precio_unidad,fotos,borrador) values($1,$2,'Papa nativa','Cusco','Cusco','San Jerónimo',1000,'kg',3,$3,false)", [lotId, producer, [photo]]);
  assert.equal((await perfil()).lotes_activos, 1);
});

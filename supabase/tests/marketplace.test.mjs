import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';

test('marketplace: publicación, fotos y aislamiento real con RLS', async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb, email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to anon, authenticated, service_role;
    create schema storage;
    create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text not null);
    alter table storage.objects enable row level security;
    grant usage on schema storage to anon, authenticated, service_role;
    grant all on storage.objects to anon, authenticated, service_role;
  `);
  for (const file of ['20260926000100_esquema_inicial.sql', '20260926000200_storage.sql', '20260926000300_auth.sql', '20260926000400_marketplace.sql']) {
    await db.exec(await readFile(new URL(`../migrations/${file}`, import.meta.url), 'utf8'));
  }
  const [producer, other, buyer, admin, unverified] = Array.from({ length: 5 }, (_, i) => `20000000-0000-4000-8000-00000000000${i + 1}`);
  for (const id of [producer, other, buyer, admin, unverified]) {
    await db.query(`insert into auth.users(id,email,raw_user_meta_data,email_confirmed_at) values ($1,$2,$3,$4)`, [id, `${id}@example.test`, JSON.stringify({ nombre_completo: 'Usuario prueba', rol: id === buyer || id === admin ? 'comprador' : 'productor', region: 'Piura', cultivo_principal: 'Mango' }), id === unverified ? null : new Date()]);
  }
  await db.query("update public.perfiles set rol = 'admin' where id = $1", [admin]);
  async function as(id, sql, args = []) {
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id ?? '']);
    await db.exec(`set role ${id ? 'authenticated' : 'anon'}`);
    try { return await db.query(sql, args); } finally { await db.exec('reset role'); }
  }
  const lot = '30000000-0000-4000-8000-000000000001';
  const photo = `${producer}/${lot}/40000000-0000-4000-8000-000000000001.jpg`;
  const insert = `insert into public.lotes(id,productor_id,cultivo,region,provincia,distrito,cantidad_disponible,unidad,precio_unidad,borrador) values ($1,$2,'Mango','Piura','Piura','Castilla',0,'kg',3.50,true)`;
  const forbidden = promise => assert.rejects(promise, e => e.code === '42501');
  await t.test('solo productor verificado crea borradores propios', async () => {
    await forbidden(as(buyer, insert, [lot, buyer]));
    await forbidden(as(admin, insert, [lot, admin]));
    await forbidden(as(unverified, insert, [lot, unverified]));
    await forbidden(as(producer, insert, [lot, other]));
    await as(producer, insert, [lot, producer]);
    assert.equal((await as(producer, 'select * from public.lotes')).rows.length, 1);
    for (const id of [null, producer, buyer, admin]) assert.equal((await as(id, 'select * from public.catalogo_lotes')).rows.length, 0);
  });
  await t.test('publicación exige foto guardada y no admite rutas ajenas', async () => {
    await assert.rejects(as(producer, 'update public.lotes set borrador=false, cantidad_disponible=100 where id=$1', [lot]), e => e.code === '22023');
    await forbidden(as(other, "insert into storage.objects(bucket_id,name) values ('fotos-lotes',$1)", [photo]));
    await forbidden(as(admin, "insert into storage.objects(bucket_id,name) values ('fotos-lotes',$1)", [photo]));
    await forbidden(as(producer, "insert into storage.objects(bucket_id,name) values ('fotos-lotes',$1)", [`${photo}/extra`]));
    await assert.rejects(as(producer, 'update public.lotes set fotos=$2 where id=$1', [lot, [photo]]), e => e.code === '22023');
    await as(producer, "insert into storage.objects(bucket_id,name) values ('fotos-lotes',$1)", [photo]);
    await as(producer, 'update public.lotes set fotos=$2,borrador=false,cantidad_disponible=100 where id=$1', [lot, [photo]]);
    assert.equal((await as(null, 'select cultivo,nivel_sello from public.catalogo_lotes')).rows[0].nivel_sello, 0);
  });
  await t.test('dueño no cambia identidad, bloqueo, fecha ni rol; otro no edita/elimina', async () => {
    for (const sql of ["update public.lotes set bloqueado=false", `update public.lotes set productor_id='${other}'`, "update public.lotes set creado_en=now()", "update public.perfiles set rol='admin'"]) await forbidden(as(producer, sql));
    assert.equal((await as(other, "update public.lotes set precio_unidad=1 where id=$1 returning id", [lot])).rows.length, 0);
    assert.equal((await as(other, 'delete from public.lotes where id=$1 returning id', [lot])).rows.length, 0);
  });
  await t.test('fotos referenciadas no pueden borrarse; límite6 y duplicados', async () => {
    assert.equal((await as(producer, 'delete from storage.objects where name=$1 returning id', [photo])).rows.length, 0);
    await assert.rejects(as(producer, 'update public.lotes set fotos=$2 where id=$1', [lot, Array(7).fill(photo)]));
    await assert.rejects(as(producer, 'update public.lotes set fotos=$2 where id=$1', [lot, [photo, photo]]), e => e.code === '22023');
  });
  await t.test('catálogo oculta agotado, bloqueado y productor suspendido para TODOS', async () => {
    for (const [hide, restore] of [
      ['update public.lotes set cantidad_disponible=0', 'update public.lotes set cantidad_disponible=100'],
      ['update public.lotes set bloqueado=true', 'update public.lotes set bloqueado=false'],
      [`update public.perfiles set suspendido=true where id='${producer}'`, `update public.perfiles set suspendido=false where id='${producer}'`],
    ]) {
      await db.exec(hide);
      for (const id of [null, producer, buyer, admin]) assert.equal((await as(id, 'select * from public.catalogo_lotes')).rows.length, 0);
      await db.exec(restore);
    }
  });
  await t.test('agregación de sello no revela evidencias y un no_pasa excluye siempre', async () => {
    await db.query(`insert into public.tests_residuos(lote_id,tipo_kit,fecha_prueba,resultado,foto_evidencia_url,realizado_por) values ($1,'Kit QA',current_date,'pasa','privado.jpg',$2)`, [lot, admin]);
    assert.equal((await as(null, 'select nivel_sello from public.catalogo_lotes')).rows[0].nivel_sello, 3);
    await db.query('delete from public.tests_residuos where lote_id=$1', [lot]);
    await db.query(`insert into public.inspecciones_dron(lote_id,estado,coordenadas_gps,fecha_vuelo,evidencia_urls) values ($1,'completado','-5,-80',current_date,ARRAY['privado.jpg'])`, [lot]);
    assert.equal((await as(null, 'select nivel_sello from public.catalogo_lotes')).rows[0].nivel_sello, 2);
    await db.query('delete from public.inspecciones_dron where lote_id=$1', [lot]);
    await db.query(`insert into public.certificados(lote_id,tipo,numero,fecha_vencimiento,archivo_url,estado) values ($1,'senasa','QA',current_date + 30,'privado.pdf','aprobado')`, [lot]);
    assert.equal((await as(null, 'select nivel_sello from public.catalogo_lotes')).rows[0].nivel_sello, 1);
    await forbidden(as(null, 'select * from public.certificados'));
    await db.query(`insert into public.tests_residuos(lote_id,tipo_kit,fecha_prueba,resultado,foto_evidencia_url,realizado_por) values ($1,'Kit QA',current_date,'no_pasa','privado.jpg',$2)`, [lot, admin]);
    for (const id of [null, producer, buyer, admin]) assert.equal((await as(id, 'select * from public.catalogo_lotes')).rows.length, 0);
    await assert.rejects(as(producer, 'delete from public.lotes where id=$1', [lot]), e => e.code === '23503');
  });
  await t.test('borrador propio eliminable; limpieza solo objetos propios sin referencias', async () => {
    const draft = '30000000-0000-4000-8000-000000000002';
    const unused = `${producer}/${draft}/40000000-0000-4000-8000-000000000002.jpg`;
    await as(producer, insert, [draft, producer]);
    await as(producer, "insert into storage.objects(bucket_id,name) values ('fotos-lotes',$1)", [unused]);
    assert.equal((await as(other, 'delete from storage.objects where name=$1 returning id', [unused])).rows.length, 0);
    assert.equal((await as(producer, 'delete from public.lotes where id=$1 returning id', [draft])).rows.length, 1);
    assert.equal((await as(producer, 'delete from storage.objects where name=$1 returning id', [unused])).rows.length, 1);
  });
});

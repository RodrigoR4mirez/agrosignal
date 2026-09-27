import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';

test('galería de hasta 5 fotos y marca de ejemplo en el perfil del comprador', async (t) => {
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

  const [producer, demo, real] = Array.from({ length: 3 }, randomUUID);
  for (const [id, rol, email] of [[producer, 'productor', `${producer}@example.test`], [demo, 'comprador', 'ana.torres.ejemplo@example.com'], [real, 'comprador', `${real}@example.test`]])
    await db.query('insert into auth.users(id,email,raw_user_meta_data,email_confirmed_at) values($1,$2,$3,now())', [id, email, JSON.stringify({ nombre_completo: 'Persona de Prueba', telefono: '999111222', rol, region: 'Piura', cultivo_principal: 'Mango' })]);
  async function as(user, sql, args = []) {
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user ?? '']);
    await db.exec(`set role ${user ? 'authenticated' : 'anon'}`);
    try { return await db.query(sql, args); } finally { await db.exec('reset role'); }
  }

  // Hasta 5 fotos por lote.
  const lote = randomUUID(), fotos = Array.from({ length: 6 }, () => `${producer}/${lote}/${randomUUID()}.jpg`);
  for (const foto of fotos) await db.query("insert into storage.objects(bucket_id,name) values('fotos-lotes',$1)", [foto]);
  await db.query("insert into public.lotes(id,productor_id,cultivo,region,provincia,distrito,cantidad_disponible,unidad,precio_unidad,fotos,borrador) values($1,$2,'Mango','Piura','Piura','Castilla',1000,'kg',3,$3,true)", [lote, producer, fotos.slice(0, 5)]);
  await as(producer, 'update public.lotes set borrador=false where id=$1', [lote]);
  assert.equal((await db.query('select cardinality(fotos) n from public.lotes where id=$1', [lote])).rows[0].n, 5);
  await assert.rejects(db.query('update public.lotes set fotos=$2 where id=$1', [lote, fotos]), e => e.code === '23514');

  // El comprador ve su propio perfil con la marca de ejemplo según su cuenta.
  assert.equal((await as(demo, 'select public.perfil_comprador($1) p', [demo])).rows[0].p.ejemplo, true);
  assert.equal((await as(real, 'select public.perfil_comprador($1) p', [real])).rows[0].p.ejemplo, false);
});

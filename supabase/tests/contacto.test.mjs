import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';

test('mensajes de contacto: envío público con límite, lectura solo admin', async (t) => {
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

  const [admin, buyer] = [randomUUID(), randomUUID()];
  for (const [id, rol] of [[admin, 'comprador'], [buyer, 'comprador']])
    await db.query('insert into auth.users(id,email,raw_user_meta_data,email_confirmed_at) values($1,$2,$3,now())', [id, `${id}@example.test`, JSON.stringify({ nombre_completo: 'Persona de Prueba', telefono: '999111222', rol })]);
  await db.query("update public.perfiles set rol='admin' where id=$1", [admin]);
  async function as(user, sql, args = []) {
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user ?? '']);
    await db.exec(`set role ${user ? 'authenticated' : 'anon'}`);
    try { return await db.query(sql, args); } finally { await db.exec('reset role'); }
  }
  const enviar = (user, correo, mensaje = 'Quiero vender 3 toneladas de palta.') =>
    as(user, "select public.enviar_mensaje_contacto('Ana Torres', $1, '', 'productor', 'vender', $2) id", [correo, mensaje]);

  // Sin sesión se puede escribir; el admin recibe un aviso.
  const { id } = (await enviar(null, 'Ana@Correo.pe')).rows[0];
  assert.ok(id);
  assert.equal((await db.query("select count(*)::int n from public.notificaciones where usuario_id=$1 and referencia_tipo='contacto'", [admin])).rows[0].n, 1);
  assert.equal((await db.query('select correo from public.mensajes_contacto where id=$1', [id])).rows[0].correo, 'ana@correo.pe');
  await assert.rejects(enviar(null, 'ana@correo.pe', 'corto'), e => e.code === '22023');
  await assert.rejects(enviar(null, 'no-es-correo'), e => e.code === '22023');
  await assert.rejects(as(null, "insert into public.mensajes_contacto(nombre,correo,perfil,asunto,mensaje) values('X','x@x.pe','otro','otro','mensaje directo')"), e => e.code === '42501');

  // Límite: 3 por correo cada 10 minutos.
  await enviar(buyer, 'ana@correo.pe'); await enviar(buyer, 'ana@correo.pe');
  await assert.rejects(enviar(buyer, 'ana@correo.pe'), e => e.code === '54000');

  // Solo el admin lee y marca como atendido.
  assert.equal((await as(buyer, 'select * from public.mensajes_contacto')).rows.length, 0);
  assert.equal((await as(null, 'select 1 from public.mensajes_contacto').catch(() => ({ rows: [] }))).rows.length, 0);
  assert.equal((await as(admin, 'select * from public.mensajes_contacto')).rows.length, 3);
  await as(buyer, 'update public.mensajes_contacto set atendido=true where id=$1', [id]);
  assert.equal((await db.query('select atendido from public.mensajes_contacto where id=$1', [id])).rows[0].atendido, false);
  await as(admin, 'update public.mensajes_contacto set atendido=true where id=$1', [id]);
  assert.equal((await db.query('select atendido from public.mensajes_contacto where id=$1', [id])).rows[0].atendido, true);
  await assert.rejects(as(admin, "update public.mensajes_contacto set mensaje='cambiado por admin' where id=$1", [id]), e => e.code === '42501');
});

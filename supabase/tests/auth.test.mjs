import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';

test('registro crea perfiles sin permitir escalamiento de privilegios', async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users (
      id uuid primary key, email text, raw_user_meta_data jsonb,
      email_confirmed_at timestamptz
    );
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    grant usage on schema auth to anon, authenticated, service_role;
  `);
  for (const file of ['20260926000100_esquema_inicial.sql', '20260926000300_auth.sql']) {
    await db.exec(await readFile(new URL(`../migrations/${file}`, import.meta.url), 'utf8'));
  }
  const buyer = '10000000-0000-4000-8000-000000000001';
  const producer = '10000000-0000-4000-8000-000000000002';
  await db.query(`insert into auth.users(id,email,raw_user_meta_data) values ($1, 'qa@example.test', $2)`,
    [buyer, JSON.stringify({ rol: 'admin', suspendido: false, nombre_completo: 'Prueba segura' })]);
  await db.query(`insert into auth.users(id,email,raw_user_meta_data) values ($1, 'campo@example.test', $2)`,
    [producer, JSON.stringify({ rol: 'productor', region: 'Piura', cultivo_principal: 'Mango', nombre_completo: 'Productor QA' })]);

  await t.test('metadata pública no concede admin ni escritura en perfiles', async () => {
    const { rows } = await db.query('select rol, suspendido from public.perfiles where id = $1', [buyer]);
    assert.deepEqual(rows[0], { rol: 'comprador', suspendido: false });
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [buyer]);
    await db.exec('set role authenticated');
    try {
      await assert.rejects(db.exec("update public.perfiles set rol = 'admin'"), error => error.code === '42501');
    } finally { await db.exec('reset role'); }
  });
  await t.test('cambiar metadata después del registro no cambia rol', async () => {
    await db.query(`update auth.users set raw_user_meta_data = '{"rol":"admin"}' where id = $1`, [producer]);
    assert.equal((await db.query('select rol from public.perfiles where id = $1', [producer])).rows[0].rol, 'productor');
  });
  await t.test('productor requiere región y cultivo incluso saltándose el formulario', async () => {
    await assert.rejects(db.exec(`insert into auth.users(id,email,raw_user_meta_data)
      values ('10000000-0000-4000-8000-000000000003', 'incompleto@example.test', '{"rol":"productor"}')`),
      error => error.code === '22023');
    assert.equal((await db.query('select count(*)::int as n from public.perfiles')).rows[0].n, 2);
  });
  await t.test('sin correo verificado o suspendido no obtiene permisos operativos', async () => {
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [producer]);
    assert.equal((await db.query('select private.rol_actual() as rol')).rows[0].rol, null);
    await db.query('update auth.users set email_confirmed_at = now() where id = $1', [producer]);
    assert.equal((await db.query('select private.rol_actual() as rol')).rows[0].rol, 'productor');
    await db.query('update public.perfiles set suspendido = true where id = $1', [producer]);
    assert.equal((await db.query('select private.rol_actual() as rol')).rows[0].rol, null);
  });
});

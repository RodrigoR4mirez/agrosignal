import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';

// PostgreSQL real embebido, con los contratos mínimos de auth/storage simulados.
// No sustituye la validación remota de Auth, Storage ni de la API de Supabase.
test('esquema inicial y aislamiento por rol', async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key, email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    grant usage on schema auth to anon, authenticated, service_role;
    create schema storage;
    create table storage.buckets (
      id text primary key, name text, public boolean,
      file_size_limit bigint, allowed_mime_types text[]
    );
    create table storage.objects (
      id uuid primary key default gen_random_uuid(),
      bucket_id text references storage.buckets(id), name text not null
    );
    alter table storage.objects enable row level security;
    grant usage on schema storage to anon, authenticated, service_role;
    grant all on storage.objects to anon, authenticated, service_role;
  `);
  for (const file of ['20260926000100_esquema_inicial.sql', '20260926000200_storage.sql']) {
    await db.exec(await readFile(new URL(`../migrations/${file}`, import.meta.url), 'utf8'));
  }

  const ids = Array.from({ length: 6 }, (_, i) => `00000000-0000-4000-8000-00000000000${i + 1}`);
  const [admin, productor, otro, comprador, sinVerificar, suspendido] = ids;
  for (const [i, id] of ids.entries()) {
    await db.query('insert into auth.users values ($1, $2)', [id, i === 4 ? null : new Date()]);
    await db.query(`insert into public.perfiles (id, nombre_completo, rol, suspendido)
      values ($1, $2, $3, $4)`, [id, `Usuario ${i + 1}`, i === 0 ? 'admin' : i === 3 ? 'comprador' : 'productor', i === 5]);
  }
  const lotes = [];
  for (const owner of [productor, otro, sinVerificar, suspendido]) {
    const { rows } = await db.query(`insert into public.lotes
      (productor_id, cultivo, region, provincia, distrito, cantidad_disponible, unidad, precio_unidad)
      values ($1, 'Papa', 'Lima', 'Lima', 'Lima', 100, 'kg', 2.50) returning id`, [owner]);
    lotes.push(rows[0].id);
  }
  const [lote, loteAjeno] = lotes;
  const ruta = `${productor}/${lote}/evidencia.jpg`;
  const rutaAjena = `${otro}/${loteAjeno}/evidencia.jpg`;
  await db.query(`insert into public.certificados (lote_id, tipo, numero, fecha_vencimiento, archivo_url)
    values ($1, 'senasa', 'TEST-001', current_date + 30, $2)`, [lote, ruta]);
  await db.query(`insert into storage.objects (bucket_id, name) values
    ('certificados', $1), ('certificados', $2), ('fotos-lotes', $1)`, [ruta, rutaAjena]);

  async function queryAs(role, id, sql, args = []) {
    assert.ok(['anon', 'authenticated'].includes(role));
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id ?? '']);
    await db.exec(`set role ${role}`);
    try { return await db.query(sql, args); }
    finally { await db.exec('reset role'); }
  }
  async function countAs(id, table, role = 'authenticated') {
    return Number((await queryAs(role, id, `select count(*) as n from ${table}`)).rows[0].n);
  }
  const denied = (promise) => assert.rejects(promise, (error) => error.code === '42501');

  await t.test('siete tablas con RLS y cuatro buckets con privacidad correcta', async () => {
    const { rows } = await db.query(`select relname from pg_class c join pg_namespace n
      on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity`);
    assert.equal(rows.length, 7);
    const buckets = (await db.query('select id, public from storage.buckets order by id')).rows;
    assert.equal(buckets.length, 4);
    assert.deepEqual(buckets.filter((b) => b.public).map((b) => b.id), ['fotos-lotes']);
  });
  await t.test('público solo ve lotes de productores activos y verificados', async () => {
    assert.equal(await countAs(null, 'public.lotes', 'anon'), 2);
    await denied(queryAs('anon', null, 'select * from public.perfiles'));
    await denied(queryAs('anon', null, 'select * from public.certificados'));
    await denied(queryAs('anon', null, 'select * from public.pedidos'));
  });
  await t.test('perfil propio y acceso administrativo; sin escalamiento de rol', async () => {
    assert.equal(await countAs(productor, 'public.perfiles'), 1);
    assert.equal(await countAs(admin, 'public.perfiles'), 6);
    await denied(queryAs('authenticated', productor, "update public.perfiles set rol = 'admin'"));
    await denied(queryAs('authenticated', productor, 'update public.lotes set bloqueado = false'));
  });
  await t.test('certificados privados: propietario y admin', async () => {
    assert.equal(await countAs(productor, 'public.certificados'), 1);
    assert.equal(await countAs(admin, 'public.certificados'), 1);
    assert.equal(await countAs(otro, 'public.certificados'), 0);
    assert.equal(await countAs(comprador, 'public.certificados'), 0);
  });
  await t.test('evidencias privadas y fotos públicas', async () => {
    assert.equal(await countAs(null, 'storage.objects', 'anon'), 1);
    assert.equal(await countAs(productor, 'storage.objects'), 2);
    assert.equal(await countAs(admin, 'storage.objects'), 3);
    assert.equal(await countAs(comprador, 'storage.objects'), 1);
    await denied(queryAs('authenticated', productor,
      "insert into storage.objects(bucket_id, name) values ('certificados', $1)", [rutaAjena]));
    await denied(queryAs('authenticated', productor,
      "insert into storage.objects(bucket_id, name) values ('evidencia-tests', $1)", [ruta]));
    await queryAs('authenticated', productor,
      "insert into storage.objects(bucket_id, name) values ('certificados', $1)", [`${productor}/${lote}/nuevo.pdf`]);
    await queryAs('authenticated', admin,
      "insert into storage.objects(bucket_id, name) values ('evidencia-tests', $1)", [ruta]);
    assert.equal((await queryAs('authenticated', admin,
      "delete from storage.objects where bucket_id = 'evidencia-tests' returning id")).rows.length, 0);
  });
  await t.test('usuarios sin verificar o suspendidos no suben archivos', async () => {
    for (const [i, id] of [sinVerificar, suspendido].entries()) {
      await denied(queryAs('authenticated', id,
        "insert into storage.objects(bucket_id, name) values ('fotos-lotes', $1)",
        [`${id}/${lotes[i + 2]}/foto.jpg`]));
    }
  });
  await t.test('no se exponen lotes agotados; el dueño aún los ve', async () => {
    await db.query('update public.lotes set cantidad_disponible = 0 where id = $1', [lote]);
    assert.equal(await countAs(null, 'public.lotes', 'anon'), 1);
    assert.equal(await countAs(productor, 'public.lotes'), 2);
    await db.query('update public.lotes set cantidad_disponible = 100 where id = $1', [lote]);
  });
  await t.test('un no_pasa oculta el lote incluso antes del trigger del módulo 4', async () => {
    await db.query(`insert into public.tests_residuos
      (lote_id, tipo_kit, fecha_prueba, resultado, foto_evidencia_url, realizado_por)
      values ($1, 'Kit prueba', current_date, 'no_pasa', $2, $3)`, [lote, ruta, admin]);
    assert.equal(await countAs(null, 'public.lotes', 'anon'), 1);
    assert.equal(await countAs(comprador, 'public.lotes'), 1);
    assert.equal(await countAs(productor, 'public.lotes'), 2);
  });
  await t.test('escrituras de negocio cerradas hasta construir los módulos', async () => {
    await denied(queryAs('authenticated', comprador, `insert into public.pedidos
      (lote_id, comprador_id, cantidad, total, direccion_entrega) values ($1, $2, 1, 2.5, 'Dirección de prueba')`,
      [loteAjeno, comprador]));
    await denied(queryAs('authenticated', productor, 'delete from public.tests_residuos'));
  });
  await t.test('stock, precio y cantidad rechazan valores NaN', async () => {
    await assert.rejects(db.query("update public.lotes set cantidad_disponible = 'NaN' where id = $1", [lote]),
      (error) => error.code === '23514');
    await assert.rejects(db.query("update public.lotes set precio_unidad = 'NaN' where id = $1", [lote]),
      (error) => error.code === '23514');
  });
});

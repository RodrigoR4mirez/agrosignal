import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';

test('admin: moderación auditada, métricas privadas y resolución sin duplicar stock', async (t) => {
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
  for (const file of ['20260926000100_esquema_inicial.sql', '20260926000200_storage.sql', '20260926000300_auth.sql', '20260926000400_marketplace.sql', '20260926000500_transacciones.sql', '20260926000600_sello_inocuidad.sql', '20260926000700_admin_panel.sql']) {
    await db.exec(await readFile(new URL(`../migrations/${file}`, import.meta.url), 'utf8'));
  }
  const [producer, buyer, admin, admin2, suspendedAdmin, unverifiedAdmin, foreignBuyer] = Array.from({ length: 7 }, randomUUID);
  for (const id of [producer, buyer, admin, admin2, suspendedAdmin, unverifiedAdmin, foreignBuyer]) {
    await db.query('insert into auth.users(id,email,raw_user_meta_data,email_confirmed_at) values($1,$2,$3,$4)', [id, `${id}@example.test`, JSON.stringify({ nombre_completo: 'Usuario QA', telefono: '999111222', rol: id === producer ? 'productor' : 'comprador', region: 'Piura', cultivo_principal: 'Mango' }), id === unverifiedAdmin ? null : new Date()]);
  }
  await db.query("update public.perfiles set rol='admin' where id=any($1)", [[admin, admin2, suspendedAdmin, unverifiedAdmin]]);
  await db.query('update public.perfiles set suspendido=true where id=$1', [suspendedAdmin]);
  async function as(user, sql, args = []) {
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user ?? '']);
    await db.exec(`set role ${user ? 'authenticated' : 'anon'}`);
    try { return await db.query(sql, args); } finally { await db.exec('reset role'); }
  }
  const forbidden = promise => assert.rejects(promise, e => e.code === '42501');
  const invalid = promise => assert.rejects(promise, e => e.code === '22023');
  const moderation = (userId, suspended, version, options = {}) => as(options.actor === undefined ? admin : options.actor, 'select public.moderar_usuario($1,$2,$3,$4,$5)', [userId, suspended, options.reason ?? 'Revisión de cuenta solicitada por soporte.', version, options.key ?? randomUUID()]);
  const resolve = (orderId, state, options = {}) => as(options.actor === undefined ? admin : options.actor, 'select public.resolver_disputa($1,$2,$3,$4,$5)', [orderId, options.action ?? 'acuerdo', options.reason ?? 'Las partes acordaron continuar con la entrega.', state, options.key ?? randomUUID()]);
  async function lot() {
    const id = randomUUID(), path = `${producer}/${id}/${randomUUID()}.jpg`;
    await db.query("insert into storage.objects(bucket_id,name) values('fotos-lotes',$1)", [path]);
    await db.query("insert into public.lotes(id,productor_id,cultivo,region,provincia,distrito,cantidad_disponible,unidad,precio_unidad,fotos,borrador) values($1,$2,'Mango','Piura','Piura','Castilla',100,'kg',5.50,$3,false)", [id, producer, [path]]);
    return id;
  }
  async function order(id) {
    return (await as(buyer, 'select public.crear_pedido($1,10,$2,$3,5.50) id', [id, 'Av. Agricultores 100, Piura', randomUUID()])).rows[0].id;
  }
  const move = (id, state, actor = producer, reason = null) => as(actor, 'select public.cambiar_estado_pedido($1,$2,$3)', [id, state, reason]);
  const stock = async id => Number((await db.query('select cantidad_disponible from public.lotes where id=$1', [id])).rows[0].cantidad_disponible);
  const getOrder = async id => (await db.query('select * from public.pedidos where id=$1', [id])).rows[0];
  const profile = async id => (await db.query('select * from public.perfiles where id=$1', [id])).rows[0];
  const notices = async id => Number((await db.query('select count(*) n from public.notificaciones where referencia_id=$1', [id])).rows[0].n);

  await t.test('RPC solo admin activo, sin privilegios por metadatos ni escritura directa', async () => {
    const id = await lot(), pedido = await order(id);
    for (const actor of [null, producer, buyer, foreignBuyer, suspendedAdmin, unverifiedAdmin]) {
      await forbidden(as(actor, 'select public.metricas_admin()'));
      await forbidden(moderation(buyer, true, 0, { actor }));
      await forbidden(resolve(pedido, 'pendiente', { actor }));
    }
    for (const actor of [producer, buyer, admin]) {
      await forbidden(as(actor, 'update public.perfiles set suspendido=true where id=$1', [buyer]));
      await forbidden(as(actor, "update public.pedidos set resolucion='Resolución falsa' where id=$1", [pedido]));
    }
    await forbidden(moderation(admin, true, 0));
    await forbidden(moderation(admin2, true, 0));
    await forbidden(moderation(randomUUID(), true, 0));
  });

  await t.test('suspender oculta catálogo, bloquea RPC y conserva histórico; reactivar avisa y aumenta versión', async () => {
    const id = await lot(), key = randomUUID();
    await invalid(moderation(producer, true, 0, { reason: '  ' }));
    await moderation(producer, true, 0, { key });
    await moderation(producer, true, 0, { key });
    let p = await profile(producer);
    assert.equal(p.suspendido, true);
    assert.equal(p.moderacion_version, 1);
    assert.equal(p.moderacion_por, admin);
    assert.equal(p.moderacion_historial.length, 1);
    assert.equal(await notices(producer), 1);
    assert.equal((await as(null, 'select id from public.catalogo_lotes where id=$1', [id])).rows.length, 0);
    await forbidden(as(producer, 'select public.solicitar_inspeccion_dron($1)', [id]));
    await invalid(moderation(producer, false, 0));
    await invalid(moderation(producer, false, 0, { key }));
    await invalid(moderation(producer, true, 0, { key, reason: 'Cambio indebido de motivo.' }));
    await moderation(producer, false, 1, { reason: 'Se verificaron los datos de la cuenta.' });
    p = await profile(producer);
    assert.equal(p.suspendido, false);
    assert.equal(p.moderacion_version, 2);
    assert.equal(p.moderacion_historial.length, 2);
    assert.equal(p.moderacion_historial[0].suspendido, true);
    assert.equal(await notices(producer), 2);
    assert.equal((await as(null, 'select id from public.catalogo_lotes where id=$1', [id])).rows.length, 1);
    await invalid(db.query("update public.perfiles set moderacion_historial='[]' where id=$1", [producer]));
    await invalid(db.query("update public.perfiles set moderacion_motivo='Motivo cambiado' where id=$1", [producer]));
  });

  await t.test('fallo de notificación revierte suspensión, versión e historial', async () => {
    await db.exec("alter table public.notificaciones add constraint qa_no_moderation check (referencia_tipo <> 'cuenta') not valid");
    try {
      await assert.rejects(moderation(buyer, true, 0), e => e.code === '23514');
      const p = await profile(buyer);
      assert.equal(p.suspendido, false);
      assert.equal(p.moderacion_version, 0);
      assert.deepEqual(p.moderacion_historial, []);
    } finally { await db.exec('alter table public.notificaciones drop constraint qa_no_moderation'); }
  });

  await t.test('cancelar confirmado consume RPC existente, devuelve stock una vez y conserva resolución', async () => {
    const id = await lot(), pedido = await order(id), key = randomUUID();
    await move(pedido, 'confirmado');
    assert.equal(await stock(id), 90);
    await resolve(pedido, 'confirmado', { action: 'cancelar', key });
    const n = await notices(pedido);
    await resolve(pedido, 'confirmado', { action: 'cancelar', key });
    assert.equal(await notices(pedido), n);
    assert.equal(await stock(id), 100);
    const row = await getOrder(pedido);
    assert.equal(row.estado, 'cancelado');
    assert.equal(row.resolucion_accion, 'cancelar');
    assert.equal(row.resolucion_estado_inicial, 'confirmado');
    assert.equal(row.resuelto_por, admin);
    for (const user of [buyer, producer, admin]) assert.equal((await as(user, 'select resolucion from public.pedidos where id=$1', [pedido])).rows[0].resolucion, row.resolucion);
    assert.equal((await as(foreignBuyer, 'select resolucion from public.pedidos where id=$1', [pedido])).rows.length, 0);
    await invalid(resolve(pedido, 'confirmado', { action: 'cancelar', key, reason: 'Intento de reemplazar el acuerdo.' }));
    await invalid(resolve(pedido, 'cancelado', { action: 'acuerdo' }));
    await invalid(db.query("update public.pedidos set resolucion='Cambio del acuerdo histórico.' where id=$1", [pedido]));
    await invalid(db.query('delete from public.pedidos where id=$1', [pedido]));
  });

  await t.test('acuerdo no altera estado ni stock y una pantalla obsoleta no sobrescribe al otro administrador', async () => {
    const id = await lot(), pedido = await order(id);
    await move(pedido, 'confirmado');
    await invalid(resolve(pedido, 'pendiente'));
    await invalid(resolve(pedido, 'confirmado', { reason: 'corto' }));
    await resolve(pedido, 'confirmado');
    assert.equal((await getOrder(pedido)).estado, 'confirmado');
    assert.equal(await stock(id), 90);
    await invalid(resolve(pedido, 'confirmado', { actor: admin2 }));
    await move(pedido, 'enviado');
    assert.equal((await getOrder(pedido)).estado, 'enviado');
    assert.equal((await getOrder(pedido)).resolucion_accion, 'acuerdo');
  });

  await t.test('cancelación restringida a pendiente/confirmado, acuerdos permitidos sobre terminales', async () => {
    const id = await lot(), pending = await order(id);
    await resolve(pending, 'pendiente', { action: 'cancelar' });
    assert.equal(await stock(id), 100);
    const shipped = await order(id);
    await move(shipped, 'confirmado');
    await move(shipped, 'enviado');
    await invalid(resolve(shipped, 'enviado', { action: 'cancelar' }));
    await move(shipped, 'recibido', buyer);
    await invalid(resolve(shipped, 'recibido', { action: 'cancelar' }));
    await resolve(shipped, 'recibido');
    assert.equal(await stock(id), 90);
    assert.equal((await getOrder(shipped)).estado, 'recibido');
  });

  await t.test('fallo de aviso de resolución revierte también estado y devolución de stock', async () => {
    const id = await lot(), pedido = await order(id);
    await move(pedido, 'confirmado');
    const n = await notices(pedido);
    await db.exec("alter table public.notificaciones add constraint qa_no_resolution check (mensaje not like 'Resolución del pedido%') not valid");
    try {
      await assert.rejects(resolve(pedido, 'confirmado', { action: 'cancelar' }), e => e.code === '23514');
      assert.equal(await stock(id), 90);
      assert.equal((await getOrder(pedido)).estado, 'confirmado');
      assert.equal((await getOrder(pedido)).resolucion, null);
      assert.equal(await notices(pedido), n);
    } finally { await db.exec('alter table public.notificaciones drop constraint qa_no_resolution'); }
  });

  await t.test('admin no desbloquea residuos fallidos al cancelar ni al reactivar productor', async () => {
    const id = await lot(), pedido = await order(id);
    await move(pedido, 'confirmado');
    const path = `${producer}/${id}/${randomUUID()}.jpg`;
    await db.query("insert into storage.objects(bucket_id,name,metadata) values('evidencia-tests',$1,$2)", [path, JSON.stringify({ mimetype: 'image/jpeg', size: 1000 })]);
    const day = (await db.query('select private.hoy_lima()::text d')).rows[0].d;
    await as(admin, "select public.registrar_test_residuos($1,'Kit QA',$2,'no_pasa',$3)", [id, day, path]);
    await resolve(pedido, 'confirmado', { action: 'cancelar', reason: 'Se cancela por residuos; el lote permanece bloqueado.' });
    const version = (await profile(producer)).moderacion_version;
    await moderation(producer, true, version);
    await moderation(producer, false, version + 1);
    assert.equal(await stock(id), 100);
    assert.equal((await db.query('select bloqueado from public.lotes where id=$1', [id])).rows[0].bloqueado, true);
    assert.equal((await as(null, 'select id from public.catalogo_lotes where id=$1', [id])).rows.length, 0);
  });

  await t.test('métricas usan mes Lima, conteos reales y no exponen información a otros roles', async () => {
    const before = (await as(admin, 'select public.metricas_admin() metrics')).rows[0].metrics;
    await db.exec("set timezone='Pacific/Kiritimati'");
    const after = (await as(admin, 'select public.metricas_admin() metrics')).rows[0].metrics;
    assert.deepEqual(before, after);
    assert.equal(after.lotes_activos, Number((await db.query('select count(*) n from public.catalogo_lotes')).rows[0].n));
    assert.equal(after.lotes_bloqueados, 1);
    assert.equal(after.usuarios_nuevos, 3);
    assert.ok(after.pedidos_mes > 0);
    assert.match(after.mes_desde, /^\d{4}-\d{2}-01$/);
    await db.exec("set timezone='UTC'");
    const fns = (await db.query("select p.proname,p.prosecdef,p.proconfig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('moderar_usuario','resolver_disputa','metricas_admin')")).rows;
    assert.equal(fns.length, 3);
    for (const fn of fns) { assert.equal(fn.prosecdef, true); assert.deepEqual(fn.proconfig, ['search_path=""']); }
  });
});

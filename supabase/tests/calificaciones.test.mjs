import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';

test('calificaciones: bidireccionales, doble ciego, ventana de 14 días y migración de pedidos existentes', async (t) => {
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
  const migrate = async file => db.exec(await readFile(new URL(`../migrations/${file}`, import.meta.url), 'utf8'));
  for (const file of ['20260926000100_esquema_inicial.sql', '20260926000200_storage.sql', '20260926000300_auth.sql', '20260926000400_marketplace.sql', '20260926000500_transacciones.sql', '20260926000600_sello_inocuidad.sql', '20260926000700_admin_panel.sql']) await migrate(file);

  const [producer, otherProducer, buyer, otherBuyer, admin] = Array.from({ length: 5 }, randomUUID);
  const extraBuyers = Array.from({ length: 5 }, randomUUID);
  for (const id of [producer, otherProducer, buyer, otherBuyer, admin, ...extraBuyers]) {
    const productor = [producer, otherProducer].includes(id);
    await db.query('insert into auth.users(id,email,raw_user_meta_data,email_confirmed_at) values($1,$2,$3,now())', [id, `${id}@example.test`, JSON.stringify({ nombre_completo: productor ? 'Rosa Quispe Mamani' : 'Carlos Huamán', telefono: '999111222', rol: productor ? 'productor' : 'comprador', region: 'Piura', cultivo_principal: 'Mango' })]);
  }
  await db.query("update public.perfiles set rol='admin' where id=$1", [admin]);
  async function as(user, sql, args = []) {
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user ?? '']);
    await db.exec(`set role ${user ? 'authenticated' : 'anon'}`);
    try { return await db.query(sql, args); } finally { await db.exec('reset role'); }
  }
  const forbidden = promise => assert.rejects(promise, e => e.code === '42501');
  const invalid = (promise, text) => assert.rejects(promise, e => e.code === '22023' && (!text || e.message.includes(text)));
  async function lot(owner = producer) {
    const id = randomUUID(), path = `${owner}/${id}/${randomUUID()}.jpg`;
    await db.query("insert into storage.objects(bucket_id,name) values('fotos-lotes',$1)", [path]);
    await db.query("insert into public.lotes(id,productor_id,cultivo,region,provincia,distrito,cantidad_disponible,unidad,precio_unidad,fotos,borrador) values($1,$2,'Mango','Piura','Piura','Castilla',1000,'kg',5.50,$3,false)", [id, owner, [path]]);
    return id;
  }
  const order = async (lotId, user = buyer) => (await as(user, 'select public.crear_pedido($1,10,$2,$3,5.50) id', [lotId, 'Av. Agricultores 100, Piura', randomUUID()])).rows[0].id;
  const move = (id, state, actor) => as(actor, 'select public.cambiar_estado_pedido($1,$2)', [id, state]);
  async function received(lotId, user = buyer, owner = producer) {
    const id = await order(lotId, user);
    await move(id, 'confirmado', owner); await move(id, 'enviado', owner); await move(id, 'recibido', user);
    return id;
  }
  const rate = (id, actor, stars, comment = null) => as(actor, 'select public.calificar_pedido($1,$2,$3) id', [id, stars, comment]);
  const status = async (id, actor) => (await as(actor, 'select public.estado_calificacion_pedido($1) s', [id])).rows[0].s;
  const catalog = async id => (await as(null, 'select productor_calificaciones, productor_promedio from public.catalogo_lotes where id=$1', [id])).rows[0];

  // Estado de producción antes del despliegue: un pedido calificado por el
  // comprador y uno recibido hace 30 días, ambos con el RPC anterior.
  const legacyLot = await lot();
  const legacyRated = await order(legacyLot), legacyReceived = await order(legacyLot);
  for (const id of [legacyRated, legacyReceived]) {
    await as(producer, 'select public.cambiar_estado_pedido($1,$2)', [id, 'confirmado']);
    await as(producer, 'select public.cambiar_estado_pedido($1,$2)', [id, 'enviado']);
    await as(buyer, 'select public.cambiar_estado_pedido($1,$2)', [id, 'recibido']);
  }
  await as(buyer, 'select public.cambiar_estado_pedido($1,$2,null,$3,$4)', [legacyRated, 'calificado', 4, 'Buena fruta.']);
  await db.query("update public.pedidos set actualizado_en = now() - interval '30 days' where id=any($1)", [[legacyRated, legacyReceived]]);
  await migrate('20260927000100_calificaciones.sql');

  await t.test('migración: ratings antiguos conservados, columnas retiradas y ventana desde el lanzamiento', async () => {
    const columns = (await db.query("select column_name from information_schema.columns where table_schema='public' and table_name='pedidos'")).rows.map(r => r.column_name);
    assert.ok(!columns.includes('calificacion') && !columns.includes('comentario') && columns.includes('recibido_en'));
    const migrated = (await db.query('select * from public.calificaciones where pedido_id=$1', [legacyRated])).rows;
    assert.equal(migrated.length, 1);
    assert.deepEqual([migrated[0].calificado_por, migrated[0].calificado_a, migrated[0].rol_calificador, migrated[0].estrellas, migrated[0].comentario, migrated[0].visible], [buyer, producer, 'comprador', 4, 'Buena fruta.', true]);
    // Recibidos hace 30 días: sin la excepción su plazo ya habría vencido.
    const legacy = await status(legacyReceived, buyer);
    assert.equal(legacy.vencido, false);
    assert.ok(new Date(legacy.cierre) > new Date(Date.now() + 13 * 864e5));
    await rate(legacyReceived, buyer, 5);
    await rate(legacyRated, producer, 5, 'Pagó puntual.');
    await invalid(rate(legacyRated, buyer, 3), 'Ya calificaste');
    assert.equal((await db.query('select bool_and(visible) v from public.calificaciones where pedido_id=$1', [legacyRated])).rows[0].v, true);
  });

  await t.test('solo las partes califican y solo desde "recibido"; "calificado" ya no es un paso', async () => {
    const id = await lot(), pedido = await order(id);
    await invalid(rate(pedido, buyer, 5), 'recibió');
    await move(pedido, 'confirmado', producer); await move(pedido, 'enviado', producer);
    await invalid(rate(pedido, producer, 5), 'recibió');
    await move(pedido, 'recibido', buyer);
    assert.ok((await db.query('select recibido_en from public.pedidos where id=$1', [pedido])).rows[0].recibido_en);
    await forbidden(move(pedido, 'calificado', buyer));
    for (const actor of [otherBuyer, otherProducer, admin, null]) await forbidden(rate(pedido, actor, 5));
    for (const stars of [null, 0, 6]) await invalid(rate(pedido, buyer, stars));
    await invalid(rate(pedido, buyer, 5, 'x'.repeat(1001)));
    await forbidden(as(buyer, "insert into public.calificaciones(pedido_id,calificado_por,calificado_a,rol_calificador,estrellas) values($1,$2,$3,'comprador',5)", [pedido, buyer, producer]));
  });

  await t.test('doble ciego: nadie ve la calificación de la otra parte hasta que ambas califican', async () => {
    const id = await lot(otherProducer), pedido = await received(id, buyer, otherProducer);
    const first = (await rate(pedido, buyer, 2, 'Llegó tarde.')).rows[0].id;
    assert.equal((await as(buyer, 'select * from public.calificaciones where id=$1', [first])).rows.length, 1);
    assert.equal((await as(otherProducer, 'select * from public.calificaciones where id=$1', [first])).rows.length, 0);
    assert.equal((await as(null, 'select * from public.resenas_productores where id=$1', [first])).rows.length, 0);
    assert.equal((await catalog(id)).productor_calificaciones, 0);
    const producerView = await status(pedido, otherProducer);
    assert.equal(producerView.otra_enviada, true);
    assert.equal(producerView.otra, null);
    assert.equal((await status(pedido, buyer)).mia.visible, false);
    const notice = (await db.query("select mensaje from public.notificaciones where referencia_id=$1 and usuario_id=$2 order by creado_en desc limit 1", [pedido, otherProducer])).rows[0].mensaje;
    assert.match(notice, /ya te calificó/);
    // La segunda parte califica: ambas se revelan a la vez.
    await rate(pedido, otherProducer, 5, 'Coordinación fácil.');
    assert.equal((await status(pedido, otherProducer)).otra.estrellas, 2);
    assert.equal((await status(pedido, buyer)).otra.estrellas, 5);
    assert.equal((await db.query('select count(*) filter (where visible) n from public.calificaciones where pedido_id=$1', [pedido])).rows[0].n, 2);
    const review = (await as(null, 'select * from public.resenas_productores where id=$1', [first])).rows[0];
    assert.equal(review.autor, 'Carlos H.');
    assert.equal(review.pedido_id, undefined);
  });

  await t.test('una por persona, inmutable y reintento idempotente', async () => {
    const pedido = await received(await lot());
    const first = (await rate(pedido, buyer, 4, 'Bien')).rows[0].id;
    assert.equal((await rate(pedido, buyer, 4, ' Bien ')).rows[0].id, first);
    await invalid(rate(pedido, buyer, 5), 'no se puede cambiar');
    await forbidden(as(buyer, 'update public.calificaciones set estrellas=5 where id=$1', [first]));
    await forbidden(as(buyer, 'delete from public.calificaciones where id=$1', [first]));
    await invalid(db.query('update public.calificaciones set estrellas=5 where id=$1', [first]));
  });

  await t.test('ventana de 14 días: vence en el servidor y la calificación única se publica al cerrar', async () => {
    const id = await lot(otherProducer), pedido = await received(id, otherBuyer, otherProducer);
    const hidden = (await rate(pedido, otherBuyer, 3)).rows[0].id;
    await db.query("update public.pedidos set recibido_en = now() - interval '15 days' where id=$1", [pedido]);
    // Simula que el lanzamiento fue hace más de 14 días.
    await db.query("update private.hitos set en = now() - interval '20 days'");
    await invalid(rate(pedido, otherProducer, 5), 'venció');
    assert.equal((await status(pedido, otherProducer)).vencido, true);
    assert.equal((await as(otherProducer, 'select * from public.calificaciones where id=$1', [hidden])).rows.length, 1);
    assert.equal((await as(null, 'select * from public.resenas_productores where id=$1', [hidden])).rows.length, 1);
    await forbidden(as(admin, 'select public.publicar_calificaciones_vencidas()'));
    assert.ok((await db.query('select public.publicar_calificaciones_vencidas() n')).rows[0].n >= 1);
    assert.equal((await db.query('select visible from public.calificaciones where id=$1', [hidden])).rows[0].visible, true);
    await db.query("update private.hitos set en = now()");
  });

  await t.test('umbral de 3, perfil público y alerta de vendedores en revisión', async () => {
    const [fresh] = Array.from({ length: 1 }, randomUUID);
    await db.query('insert into auth.users(id,email,raw_user_meta_data,email_confirmed_at) values($1,$2,$3,now())', [fresh, `${fresh}@example.test`, JSON.stringify({ nombre_completo: 'Productor Nuevo', telefono: '999111222', rol: 'productor', region: 'Ica', cultivo_principal: 'Uva' })]);
    const id = await lot(fresh);
    assert.deepEqual(await catalog(id), { productor_calificaciones: 0, productor_promedio: null });
    const orders = [];
    for (const user of extraBuyers) orders.push(await received(id, user, fresh));
    for (const [index, pedido] of orders.entries()) {
      await rate(pedido, extraBuyers[index], index < 4 ? 2 : 3);
      await rate(pedido, fresh, 5);
      if (index === 1) assert.equal((await catalog(id)).productor_promedio, null);
      if (index === 2) assert.equal(Number((await catalog(id)).productor_promedio), 2);
    }
    const perfil = (await as(null, 'select public.perfil_productor($1) p', [fresh])).rows[0].p;
    assert.equal(perfil.reputacion.total, 5);
    assert.equal(perfil.reputacion.distribucion['2'], 4);
    assert.equal((await as(null, 'select public.perfil_productor($1) p', [buyer])).rows[0].p, null);
    await forbidden(as(producer, 'select * from public.vendedores_en_revision()'));
    const review = (await as(admin, 'select * from public.vendedores_en_revision()')).rows;
    assert.deepEqual(review.map(r => [r.productor_id, r.total, Number(r.promedio)]), [[fresh, 5, 2.2]]);
    assert.equal((await as(admin, 'select public.metricas_admin() m')).rows[0].m.vendedores_en_revision, 1);
    // Las calificaciones que recibe un comprador no cuentan para el productor.
    assert.ok(!review.some(r => extraBuyers.includes(r.productor_id)));
  });
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';

test('transacciones: RPC atómicas, stock, historial privado y siete estados', async (t) => {
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
  for (const file of ['20260926000100_esquema_inicial.sql', '20260926000200_storage.sql', '20260926000300_auth.sql', '20260926000400_marketplace.sql', '20260926000500_transacciones.sql']) {
    await db.exec(await readFile(new URL(`../migrations/${file}`, import.meta.url), 'utf8'));
  }
  const [producer, otherProducer, buyer, otherBuyer, admin, unverified] = Array.from({ length: 6 }, randomUUID);
  for (const id of [producer, otherProducer, buyer, otherBuyer, admin, unverified]) {
    await db.query(`insert into auth.users(id,email,raw_user_meta_data,email_confirmed_at) values ($1,$2,$3,$4)`, [id, `${id}@example.test`, JSON.stringify({ nombre_completo: id === producer ? 'Productor QA' : 'Comprador QA', telefono: '999111222', rol: [producer, otherProducer].includes(id) ? 'productor' : 'comprador', region: 'Piura', cultivo_principal: 'Mango' }), id === unverified ? null : new Date()]);
  }
  await db.query("update public.perfiles set rol='admin' where id=$1", [admin]);
  async function as(id, sql, args = []) {
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id ?? '']);
    await db.exec(`set role ${id ? 'authenticated' : 'anon'}`);
    try { return await db.query(sql, args); } finally { await db.exec('reset role'); }
  }
  const forbidden = promise => assert.rejects(promise, e => e.code === '42501');
  const invalid = promise => assert.rejects(promise, e => e.code === '22023');
  async function lot(stock = 100, price = 5.5) {
    const id = randomUUID();
    const photo = `${producer}/${id}/${randomUUID()}.jpg`;
    await db.query("insert into storage.objects(bucket_id,name) values ('fotos-lotes',$1)", [photo]);
    await db.query(`insert into public.lotes(id,productor_id,cultivo,region,provincia,distrito,cantidad_disponible,unidad,precio_unidad,fotos,borrador) values ($1,$2,'Mango','Piura','Piura','Castilla',$3,'kg',$4,$5,false)`, [id, producer, stock, price, [photo]]);
    return id;
  }
  async function create(id, qty = 10, options = {}) {
    return (await as(options.user ?? buyer, 'select public.crear_pedido($1,$2,$3,$4,$5) id', [id, qty, options.address ?? 'Av. Los Agricultores 100, Lima', options.key ?? randomUUID(), options.price ?? 5.5])).rows[0].id;
  }
  async function move(id, state, user, opts = {}) {
    return as(user, 'select public.cambiar_estado_pedido($1,$2,$3,$4,$5)', [id, state, opts.reason ?? null, opts.rating ?? null, opts.comment ?? null]);
  }
  async function stock(id) { return Number((await db.query('select cantidad_disponible from public.lotes where id=$1', [id])).rows[0].cantidad_disponible); }
  async function notices(id) { return Number((await db.query('select count(*) n from public.notificaciones where referencia_id=$1', [id])).rows[0].n); }
  async function order(id) { return (await db.query('select * from public.pedidos where id=$1', [id])).rows[0]; }

  await t.test('solo comprador verificado crea y no hay escritura directa ni RPC anónima', async () => {
    const id = await lot();
    for (const user of [producer, otherProducer, admin, unverified]) await forbidden(create(id, 10, { user }));
    await forbidden(as(null, 'select public.crear_pedido($1,10,$2,$3,5.5)', [id, 'Av. Agricultores 100', randomUUID()]));
    await forbidden(as(buyer, "insert into public.pedidos(lote_id) values ($1)", [id]));
    await forbidden(as(buyer, 'update public.pedidos set total=1'));
    await forbidden(as(producer, "update public.pedidos set estado='confirmado'"));
    await forbidden(as(buyer, 'delete from public.pedidos'));
    await forbidden(as(buyer, "insert into public.notificaciones(usuario_id,mensaje,referencia_tipo,referencia_id) values($1,'Falso','pedido',$2)", [buyer, id]));
    await forbidden(as(buyer, 'update public.notificaciones set leida=true'));
  });

  await t.test('precio real, total redondeado, idempotencia y límite de precisión', async () => {
    const id = await lot(100, 5.55);
    const key = randomUUID();
    const pedido = await create(id, 1.234, { key, price: 5.55 });
    assert.equal(await stock(id), 100);
    assert.equal(await notices(pedido), 2);
    const snapshot = await order(pedido);
    assert.equal(Number(snapshot.total), 6.85);
    assert.equal(Number(snapshot.precio_unidad), 5.55);
    assert.equal(snapshot.productor_nombre, 'Productor QA');
    assert.equal(snapshot.productor_telefono, '999111222');
    assert.equal(await create(id, 1.234, { key, price: 5.55 }), pedido);
    assert.equal(await notices(pedido), 2);
    await invalid(create(id, 1.235, { key, price: 5.55 }));
    for (const qty of [0, -1, 'NaN', 'Infinity', 1.0001, 101, 100000000000]) await invalid(create(id, qty, { price: 5.55 }));
    for (const price of [5.5, 'NaN', 'Infinity', 5.555]) await invalid(create(id, 1, { price }));
    await invalid(create(id, 1, { price: 5.55, address: 'Corta' }));
    const expensive = await lot(99999999999.999, 999999999999.99);
    await invalid(create(expensive, 99999999999, { price: 999999999999.99 }));
    const cheap = await lot(100, 0.01);
    await invalid(create(cheap, 0.001, { price: 0.01 }));
  });

  await t.test('flujo completo y reintentos no duplican stock ni notificaciones', async () => {
    const id = await lot(10);
    const pedido = await create(id, 10);
    await forbidden(move(pedido, 'confirmado', buyer));
    await forbidden(move(pedido, 'confirmado', otherProducer));
    await invalid(move(pedido, 'enviado', producer));
    await invalid(move(pedido, 'recibido', buyer));
    await move(pedido, 'confirmado', producer);
    assert.equal(await stock(id), 0);
    assert.equal(await notices(pedido), 4);
    await move(pedido, 'confirmado', producer);
    assert.equal(await stock(id), 0);
    assert.equal(await notices(pedido), 4);
    assert.equal((await as(buyer, 'select * from public.catalogo_lotes where id=$1', [id])).rows.length, 0);
    assert.equal((await as(buyer, 'select * from public.pedidos where id=$1', [pedido])).rows.length, 1);
    await forbidden(move(pedido, 'enviado', buyer));
    await move(pedido, 'enviado', producer);
    await invalid(move(pedido, 'cancelado', buyer, { reason: 'Ya no deseo recibir' }));
    await invalid(move(pedido, 'calificado', buyer, { rating: 5 }));
    await forbidden(move(pedido, 'recibido', producer));
    await move(pedido, 'recibido', buyer);
    for (const rating of [null, 0, 6]) await invalid(move(pedido, 'calificado', buyer, { rating }));
    await invalid(move(pedido, 'calificado', buyer, { rating: 5, comment: 'x'.repeat(1001) }));
    await move(pedido, 'calificado', buyer, { rating: 5, comment: 'Excelente entrega.' });
    await move(pedido, 'calificado', buyer, { rating: 5, comment: 'Excelente entrega.' });
    await invalid(move(pedido, 'calificado', buyer, { rating: 4 }));
    assert.equal(await notices(pedido), 10);
    assert.equal((await order(pedido)).estado, 'calificado');
    assert.equal((await order(pedido)).calificacion, 5);
    assert.equal(await stock(id), 0);
  });

  await t.test('dos pendientes compiten por stock; la segunda aceptación revierte sin sobreventa', async () => {
    const id = await lot(10);
    const first = await create(id, 7);
    const second = await create(id, 7, { user: otherBuyer });
    await move(first, 'confirmado', producer);
    await invalid(move(second, 'confirmado', producer));
    assert.equal(await stock(id), 3);
    assert.equal((await order(second)).estado, 'pendiente');
    assert.equal(await notices(second), 2);
    await move(first, 'cancelado', buyer, { reason: 'Cambio de planes' });
    assert.equal(await stock(id), 10);
    await move(first, 'cancelado', buyer, { reason: 'Cambio de planes' });
    assert.equal(await stock(id), 10);
    assert.equal(await notices(first), 6);
    await move(second, 'confirmado', producer);
    assert.equal(await stock(id), 3);
    await move(second, 'cancelado', producer, { reason: 'Problema de entrega' });
    assert.equal(await stock(id), 10);
  });

  await t.test('rechazo y cancelación pendiente no alteran stock; admin usa mismas reglas', async () => {
    const id = await lot();
    const rejected = await create(id);
    await invalid(move(rejected, 'rechazado', producer));
    await move(rejected, 'rechazado', producer, { reason: 'No puedo entregar' });
    await invalid(move(rejected, 'confirmado', producer));
    const canceled = await create(id);
    await forbidden(move(canceled, 'cancelado', otherBuyer, { reason: 'Ajeno' }));
    await move(canceled, 'cancelado', buyer, { reason: 'Ya no necesito el pedido' });
    const dispute = await create(id);
    await move(dispute, 'confirmado', producer);
    await forbidden(move(dispute, 'enviado', admin));
    await move(dispute, 'cancelado', admin, { reason: 'Acuerdo entre las partes' });
    assert.equal(await stock(id), 100);
    assert.equal(await notices(rejected), 4);
    assert.equal(await notices(canceled), 4);
    assert.equal(await notices(dispute), 6);
  });

  await t.test('snapshots e historial sobreviven cambios de precio, ocultación y agotamiento', async () => {
    const id = await lot();
    const pedido = await create(id);
    await as(producer, 'update public.lotes set precio_unidad=9 where id=$1', [id]);
    await invalid(as(producer, "update public.lotes set unidad='ton' where id=$1", [id]));
    await invalid(as(producer, "update public.lotes set cultivo='Papa' where id=$1", [id]));
    await move(pedido, 'confirmado', producer);
    assert.equal(Number((await order(pedido)).total), 55);
    assert.equal(Number((await order(pedido)).precio_unidad), 5.5);
    await db.query('update public.lotes set bloqueado=true where id=$1', [id]);
    for (const user of [buyer, producer, admin]) assert.equal((await as(user, 'select * from public.pedidos where id=$1', [pedido])).rows.length, 1);
    for (const user of [otherBuyer, otherProducer, unverified]) assert.equal((await as(user, 'select * from public.pedidos where id=$1', [pedido])).rows.length, 0);
    await forbidden(as(null, 'select * from public.pedidos'));
    await move(pedido, 'cancelado', buyer, { reason: 'Lote ya no disponible' });
    assert.equal(await stock(id), 100);
    assert.equal((await db.query('select bloqueado from public.lotes where id=$1', [id])).rows[0].bloqueado, true);
  });

  await t.test('crear y confirmar revalidan visibilidad, residuo no_pasa y productor activo', async () => {
    const id = await lot();
    const pedido = await create(id);
    for (const [hide, restore] of [
      ['update public.lotes set bloqueado=true where id=$1', 'update public.lotes set bloqueado=false where id=$1'],
      ['update public.lotes set borrador=true where id=$1', 'update public.lotes set borrador=false where id=$1'],
      ['update public.lotes set cantidad_disponible=0 where id=$1', 'update public.lotes set cantidad_disponible=100 where id=$1'],
    ]) {
      await db.query(hide, [id]);
      await invalid(create(id));
      await invalid(move(pedido, 'confirmado', producer));
      assert.equal(await notices(pedido), 2);
      await db.query(restore, [id]);
    }
    await db.query('update public.perfiles set suspendido=true where id=$1', [producer]);
    await invalid(create(id));
    await forbidden(move(pedido, 'confirmado', producer));
    await db.query('update public.perfiles set suspendido=false where id=$1', [producer]);
    await db.query('update auth.users set email_confirmed_at=null where id=$1', [producer]);
    await invalid(create(id));
    await forbidden(move(pedido, 'confirmado', producer));
    await db.query('update auth.users set email_confirmed_at=now() where id=$1', [producer]);
    await db.query(`insert into public.tests_residuos(lote_id,tipo_kit,fecha_prueba,resultado,foto_evidencia_url,realizado_por) values($1,'Kit QA',current_date,'no_pasa','privado.jpg',$2)`, [id, admin]);
    await invalid(create(id));
    await invalid(move(pedido, 'confirmado', producer));
    assert.equal(await stock(id), 100);
    await db.query('update public.perfiles set suspendido=true where id=$1', [buyer]);
    assert.equal((await as(buyer, 'select * from public.pedidos')).rows.length, 0);
    await forbidden(create(id));
    await forbidden(move(pedido, 'cancelado', buyer, { reason: 'Prueba suspendido' }));
    await db.query('update public.perfiles set suspendido=false where id=$1', [buyer]);
  });

  await t.test('notificaciones privadas, lectura idempotente y texto no editable', async () => {
    const id = await lot();
    const pedido = await create(id);
    const own = (await as(buyer, 'select * from public.notificaciones where referencia_id=$1', [pedido])).rows;
    assert.equal(own.length, 1);
    assert.equal(own[0].leida, false);
    assert.equal((await as(producer, 'select * from public.notificaciones where referencia_id=$1', [pedido])).rows.length, 1);
    for (const user of [otherBuyer, otherProducer, admin, unverified]) assert.equal((await as(user, 'select * from public.notificaciones where referencia_id=$1', [pedido])).rows.length, 0);
    await forbidden(as(otherBuyer, 'select public.marcar_notificacion_leida($1)', [own[0].id]));
    await as(buyer, 'select public.marcar_notificacion_leida($1)', [own[0].id]);
    await as(buyer, 'select public.marcar_notificacion_leida($1)', [own[0].id]);
    assert.equal((await as(buyer, 'select leida from public.notificaciones where id=$1', [own[0].id])).rows[0].leida, true);
    await forbidden(as(buyer, "update public.notificaciones set mensaje='Falso' where id=$1", [own[0].id]));
    assert.equal(await notices(pedido), 2);
  });
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';

test('sello: RPC autorizadas, evidencia privada, caducidad y bloqueo irreversible', async (t) => {
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
    create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text not null, metadata jsonb);
    alter table storage.objects enable row level security;
    grant usage on schema storage to anon, authenticated, service_role;
    grant all on storage.objects to anon, authenticated, service_role;
  `);
  for (const file of ['20260926000100_esquema_inicial.sql', '20260926000200_storage.sql', '20260926000300_auth.sql', '20260926000400_marketplace.sql', '20260926000500_transacciones.sql', '20260926000600_sello_inocuidad.sql']) {
    await db.exec(await readFile(new URL(`../migrations/${file}`, import.meta.url), 'utf8'));
  }
  const [producer, otherProducer, buyer, admin, admin2, suspendedAdmin, unverifiedAdmin] = Array.from({ length: 7 }, randomUUID);
  for (const id of [producer, otherProducer, buyer, admin, admin2, suspendedAdmin, unverifiedAdmin]) {
    await db.query(`insert into auth.users(id,email,raw_user_meta_data,email_confirmed_at) values($1,$2,$3,$4)`, [id, `${id}@example.test`, JSON.stringify({ nombre_completo: 'Usuario QA', telefono: '999111222', rol: [producer, otherProducer].includes(id) ? 'productor' : 'comprador', region: 'Piura', cultivo_principal: 'Mango' }), id === unverifiedAdmin ? null : new Date()]);
  }
  await db.query("update public.perfiles set rol='admin' where id=any($1)", [[admin, admin2, suspendedAdmin, unverifiedAdmin]]);
  await db.query('update public.perfiles set suspendido=true where id=$1', [suspendedAdmin]);
  const today = (await db.query('select private.hoy_lima()::text hoy')).rows[0].hoy;
  const yesterday = (await db.query("select (private.hoy_lima()-1)::text dia")).rows[0].dia;
  const tomorrow = (await db.query("select (private.hoy_lima()+1)::text dia")).rows[0].dia;
  async function as(user, sql, args = []) {
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user ?? '']);
    await db.exec(`set role ${user ? 'authenticated' : 'anon'}`);
    try { return await db.query(sql, args); } finally { await db.exec('reset role'); }
  }
  const forbidden = promise => assert.rejects(promise, e => e.code === '42501');
  const invalid = promise => assert.rejects(promise, e => e.code === '22023');
  async function lot() {
    const id = randomUUID(), path = `${producer}/${id}/${randomUUID()}.jpg`;
    await db.query("insert into storage.objects(bucket_id,name) values('fotos-lotes',$1)", [path]);
    await db.query(`insert into public.lotes(id,productor_id,cultivo,region,provincia,distrito,cantidad_disponible,unidad,precio_unidad,fotos,borrador) values($1,$2,'Mango','Piura','Piura','Castilla',10,'kg',5.50,$3,false)`, [id, producer, [path]]);
    return id;
  }
  async function evidence(id, bucket = 'certificados', options = {}) {
    const extension = options.ext ?? (bucket === 'certificados' ? 'pdf' : 'jpg');
    const path = options.path ?? `${producer}/${id}/${randomUUID()}.${extension}`;
    const mime = { pdf: 'application/pdf', jpg: 'image/jpeg', mp4: 'video/mp4', webp: 'image/webp', png: 'image/png' }[extension];
    await db.query('insert into storage.objects(bucket_id,name,metadata) values($1,$2,$3)', [bucket, path, JSON.stringify({ mimetype: options.mime ?? mime, size: options.size ?? 1024 })]);
    return path;
  }
  async function certificate(id, options = {}) {
    const path = options.path ?? await evidence(id);
    return (await as(options.user ?? producer, 'select public.subir_certificado($1,$2,$3,$4,$5) id', [id, options.type ?? 'senasa', options.number ?? 'SENASA-QA-001', options.date ?? tomorrow, path])).rows[0].id;
  }
  const review = (id, state = 'aprobado', user = admin, reason = null) => as(user, 'select public.revisar_certificado($1,$2,$3)', [id, state, reason]);
  const requestDrone = async (id, user = producer) => (await as(user, 'select public.solicitar_inspeccion_dron($1) id', [id])).rows[0].id;
  const completeDrone = (id, paths, options = {}) => as(options.user ?? admin, 'select public.completar_inspeccion_dron($1,$2,$3,$4,$5,$6)', [id, options.lat ?? -5.19449, options.lon ?? -80.63282, options.date ?? today, paths, options.notes ?? 'Vuelo de inspección QA']);
  async function residue(id, result = 'pasa', options = {}) {
    const path = options.path ?? await evidence(id, 'evidencia-tests');
    return (await as(options.user ?? admin, 'select public.registrar_test_residuos($1,$2,$3,$4,$5) id', [id, options.kit ?? 'Kit QA', options.date ?? today, result, path])).rows[0].id;
  }
  const summary = async (id, user = null) => (await as(user, 'select public.estado_sello_lote($1) estado', [id])).rows[0].estado;
  const noticeCount = async id => Number((await db.query("select count(*) n from public.notificaciones where referencia_tipo='sello' and referencia_id=$1", [id])).rows[0].n);
  const publicLot = async id => (await as(null, 'select * from public.catalogo_lotes where id=$1', [id])).rows;

  await t.test('tablas y RPC bloquean escritura directa, comprador, productor ajeno y admin inactivo', async () => {
    const id = await lot();
    for (const table of ['certificados', 'inspecciones_dron', 'tests_residuos']) {
      for (const user of [producer, buyer, admin]) {
        await forbidden(as(user, `insert into public.${table}(lote_id) values($1)`, [id]));
        await forbidden(as(user, `update public.${table} set lote_id=$1`, [id]));
        await forbidden(as(user, `delete from public.${table}`));
      }
    }
    for (const user of [otherProducer, buyer, admin, suspendedAdmin, unverifiedAdmin]) {
      await forbidden(certificate(id, { user }));
      await forbidden(requestDrone(id, user));
    }
    for (const user of [producer, otherProducer, buyer, suspendedAdmin, unverifiedAdmin]) await forbidden(residue(id, 'pasa', { user }));
    await forbidden(as(null, 'select public.solicitar_inspeccion_dron($1)', [id]));
    await forbidden(as(buyer, 'select private.resumen_sello($1)', [id]));
    await forbidden(as(producer, "update public.perfiles set rol='admin' where id=$1", [producer]));
  });

  await t.test('Storage limita bucket, dueño, ruta UUID y lectura privada; evidencias no se sobrescriben ni borran', async () => {
    const id = await lot(), path = `${producer}/${id}/${randomUUID()}.pdf`;
    await as(producer, "insert into storage.objects(bucket_id,name,metadata) values('certificados',$1,$2)", [path, JSON.stringify({ mimetype: 'application/pdf', size: 1024 })]);
    for (const user of [otherProducer, buyer, admin]) await forbidden(as(user, "insert into storage.objects(bucket_id,name) values('certificados',$1)", [`${producer}/${id}/${randomUUID()}.pdf`]));
    for (const path of [`${producer}/${id}/arbitrario.pdf`, `${producer}/${id}/${randomUUID()}.html`, `${producer}/${id}/${randomUUID()}.pdf/extra`]) await forbidden(as(producer, "insert into storage.objects(bucket_id,name) values('certificados',$1)", [path]));
    const dronePath = `${producer}/${id}/${randomUUID()}.mp4`;
    await as(admin, "insert into storage.objects(bucket_id,name) values('evidencia-drones',$1)", [dronePath]);
    await forbidden(as(producer, "insert into storage.objects(bucket_id,name) values('evidencia-drones',$1)", [`${producer}/${id}/${randomUUID()}.jpg`]));
    for (const user of [producer, admin]) assert.equal((await as(user, 'select * from storage.objects where name=$1', [path])).rows.length, 1);
    for (const user of [buyer, otherProducer, suspendedAdmin, unverifiedAdmin, null]) assert.equal((await as(user, 'select * from storage.objects where name=$1', [path])).rows.length, 0);
    for (const user of [producer, admin]) {
      assert.equal((await as(user, 'delete from storage.objects where name=$1 returning id', [path])).rows.length, 0);
      assert.equal((await as(user, "update storage.objects set metadata='{}' where name=$1 returning id", [path])).rows.length, 0);
    }
  });

  await t.test('certificados validan existencia, lote, MIME, tamaño y caducidad antes de registrar', async () => {
    const id = await lot(), foreign = await lot();
    for (const path of [
      `${producer}/${id}/${randomUUID()}.pdf`,
      await evidence(foreign),
      await evidence(id, 'certificados', { mime: 'text/html' }),
      await evidence(id, 'certificados', { size: 0 }),
      await evidence(id, 'certificados', { size: 10485761 }),
      await evidence(id, 'certificados', { size: 'NaN' }),
      await evidence(id, 'certificados', { ext: 'jpg', mime: 'application/pdf' }),
    ]) await invalid(certificate(id, { path }));
    await invalid(certificate(id, { date: yesterday }));
    await invalid(certificate(id, { date: 'infinity' }));
    await invalid(certificate(id, { number: '' }));
    assert.equal((await db.query('select * from public.certificados where lote_id=$1', [id])).rows.length, 0);
  });

  await t.test('revisión solo admin, rechazo motivado, privacidad y reintentos idempotentes', async () => {
    const id = await lot(), path = await evidence(id);
    const cert = await certificate(id, { path });
    assert.equal(await certificate(id, { path }), cert);
    assert.equal(await noticeCount(id), 3);
    assert.equal((await summary(id)).documental, 'en_revision');
    assert.equal((await summary(id)).nivel_sello, 0);
    for (const user of [producer, buyer, otherProducer, suspendedAdmin, unverifiedAdmin]) await forbidden(review(cert, 'aprobado', user));
    await invalid(review(cert, 'rechazado'));
    await invalid(review(cert, 'en_revision'));
    await review(cert, 'rechazado', admin, 'Falta la firma del emisor.');
    await review(cert, 'rechazado', admin, 'Falta la firma del emisor.');
    assert.equal(await noticeCount(id), 4);
    await invalid(review(cert));
    for (const user of [producer, admin]) assert.equal((await as(user, 'select * from public.certificados where id=$1', [cert])).rows.length, 1);
    for (const user of [buyer, otherProducer, suspendedAdmin]) assert.equal((await as(user, 'select * from public.certificados where id=$1', [cert])).rows.length, 0);
    await forbidden(as(null, 'select * from public.certificados'));
    const dto = await summary(id);
    assert.deepEqual(Object.keys(dto).sort(), ['bloqueado', 'documental', 'dron', 'nivel_sello', 'residuos']);
    assert.equal(dto.documental, 'rechazado');
    assert.ok(!JSON.stringify(dto).includes('SENASA-QA') && !JSON.stringify(dto).includes('firma'));
  });

  await t.test('certificado vence por lectura Lima sin cron y sin editar estado histórico', async () => {
    const id = await lot(), cert = await certificate(id, { date: today });
    await review(cert);
    assert.equal((await summary(id)).nivel_sello, 1);
    assert.equal((await publicLot(id))[0].nivel_sello, 1);
    await db.query('update public.certificados set fecha_vencimiento=$1 where id=$2', [yesterday, cert]);
    assert.equal((await summary(id)).documental, 'vencido');
    assert.equal((await summary(id)).nivel_sello, 0);
    assert.equal((await publicLot(id))[0].nivel_sello, 0);
    assert.equal((await db.query('select estado from public.certificados where id=$1', [cert])).rows[0].estado, 'aprobado');
    const pending = await certificate(id);
    await db.query('update public.certificados set fecha_vencimiento=$1 where id=$2', [yesterday, pending]);
    await invalid(review(pending));
    await db.exec("set timezone='Pacific/Kiritimati'");
    assert.equal((await db.query('select private.hoy_lima()::text dia')).rows[0].dia, today);
    assert.equal((await summary(id)).nivel_sello, 0);
    await db.exec("set timezone='UTC'");
  });

  await t.test('dron solicitud única, GPS/fecha/evidencia validada, nivel2 independiente y resultados inmutables', async () => {
    const id = await lot(), request = await requestDrone(id);
    assert.equal(await requestDrone(id), request);
    assert.equal(await noticeCount(id), 3);
    assert.equal((await summary(id)).dron, 'solicitado');
    const path = await evidence(id, 'evidencia-drones', { ext: 'mp4' });
    for (const user of [producer, buyer, suspendedAdmin]) await forbidden(completeDrone(request, [path], { user }));
    for (const options of [{ lat: 'NaN' }, { lon: 'Infinity' }, { lat: 91 }, { lon: -181 }, { date: tomorrow }, { date: '1900-01-01' }, { notes: 'x'.repeat(2001) }]) await invalid(completeDrone(request, [path], options));
    await invalid(completeDrone(request, []));
    await invalid(completeDrone(request, [path, path]));
    await invalid(completeDrone(request, [await evidence(await lot(), 'evidencia-drones')]));
    await invalid(completeDrone(request, [await evidence(id, 'evidencia-drones', { mime: 'application/pdf' })]));
    await completeDrone(request, [path]);
    await completeDrone(request, [path]);
    await invalid(completeDrone(request, [path], { notes: 'Cambio indebido' }));
    const result = await summary(id);
    assert.equal(result.nivel_sello, 2);
    assert.equal(result.documental, 'sin_verificar');
    assert.equal((await publicLot(id))[0].nivel_sello, 2);
    assert.equal(await noticeCount(id), 4);
    for (const user of [buyer, otherProducer]) assert.equal((await as(user, 'select * from public.inspecciones_dron where lote_id=$1', [id])).rows.length, 0);
    assert.notEqual(await requestDrone(id), request);
  });

  await t.test('residuos pasa logra nivel3 independiente, valida kit/fecha/foto y no duplica', async () => {
    const id = await lot(), path = await evidence(id, 'evidencia-tests');
    for (const options of [{ kit: 'x' }, { date: tomorrow }, { date: '1900-01-01' }, { path: await evidence(await lot(), 'evidencia-tests') }, { path: await evidence(id, 'evidencia-tests', { mime: 'text/html' }) }, { path: await evidence(id, 'evidencia-tests', { size: 5242881 }) }]) await invalid(residue(id, 'pasa', options));
    const record = await residue(id, 'pasa', { path });
    assert.equal(await residue(id, 'pasa', { path }), record);
    await invalid(residue(id, 'no_pasa', { path }));
    assert.equal(await noticeCount(id), 1);
    assert.deepEqual(await summary(id), { bloqueado: false, documental: 'sin_verificar', dron: 'sin_solicitar', residuos: 'pasa', nivel_sello: 3 });
    assert.equal((await publicLot(id))[0].nivel_sello, 3);
    for (const user of [buyer, otherProducer]) assert.equal((await as(user, 'select * from public.tests_residuos where lote_id=$1', [id])).rows.length, 0);
  });

  await t.test('no_pasa bloquea con avisos solo productor/admin activos y sigue bloqueado después de pasa', async () => {
    const id = await lot(), path = await evidence(id, 'evidencia-tests');
    const record = await residue(id, 'no_pasa', { path });
    assert.equal(await residue(id, 'no_pasa', { path }), record);
    assert.equal(await noticeCount(id), 3);
    const recipients = (await db.query("select usuario_id from public.notificaciones where referencia_tipo='sello' and referencia_id=$1", [id])).rows.map(x => x.usuario_id).sort();
    assert.deepEqual(recipients, [producer, admin, admin2].sort());
    assert.equal((await db.query('select bloqueado from public.lotes where id=$1', [id])).rows[0].bloqueado, true);
    assert.equal((await publicLot(id)).length, 0);
    assert.equal(await summary(id), null);
    assert.equal(await summary(id, buyer), null);
    assert.equal((await summary(id, producer)).residuos, 'no_pasa');
    await forbidden(as(producer, 'update public.lotes set bloqueado=false where id=$1', [id]));
    await invalid(db.query('update public.lotes set bloqueado=false where id=$1', [id]));
    await invalid(db.query("update public.tests_residuos set resultado='pasa' where id=$1", [record]));
    await invalid(db.query('delete from public.tests_residuos where id=$1', [record]));
    await residue(id, 'pasa');
    assert.equal((await summary(id, admin)).nivel_sello, 0);
    assert.equal((await summary(id, admin)).residuos, 'no_pasa');
    assert.equal((await publicLot(id)).length, 0);
    await as(producer, 'update public.lotes set cantidad_disponible=100,borrador=true where id=$1', [id]);
    await as(producer, 'update public.lotes set borrador=false where id=$1', [id]);
    assert.equal((await publicLot(id)).length, 0);
  });

  await t.test('fallo en notificación revierte test y bloqueo en la misma transacción', async () => {
    const id = await lot(), path = await evidence(id, 'evidencia-tests');
    await db.exec("alter table public.notificaciones add constraint qa_no_failed_notice check (mensaje not like 'El test de residuos%') not valid");
    try {
      await assert.rejects(residue(id, 'no_pasa', { path }), e => e.code === '23514');
      assert.equal((await db.query('select * from public.tests_residuos where lote_id=$1', [id])).rows.length, 0);
      assert.equal((await db.query('select bloqueado from public.lotes where id=$1', [id])).rows[0].bloqueado, false);
      assert.equal(await noticeCount(id), 0);
      assert.equal((await publicLot(id)).length, 1);
    } finally { await db.exec('alter table public.notificaciones drop constraint qa_no_failed_notice'); }
  });

  await t.test('pedido confirmado de lote bloqueado no se envía; cancelación devuelve stock sin desbloquear', async () => {
    async function order(id) {
      return (await as(buyer, 'select public.crear_pedido($1,10,$2,$3,5.50) id', [id, 'Av. Agricultores 100, Piura', randomUUID()])).rows[0].id;
    }
    const move = (id, state, user = producer, reason = null) => as(user, 'select public.cambiar_estado_pedido($1,$2,$3)', [id, state, reason]);
    const id = await lot(), pedido = await order(id);
    await move(pedido, 'confirmado');
    await residue(id, 'no_pasa');
    await invalid(move(pedido, 'enviado'));
    assert.equal((await db.query('select estado from public.pedidos where id=$1', [pedido])).rows[0].estado, 'confirmado');
    await move(pedido, 'cancelado', producer, 'Lote bloqueado por residuos');
    const blocked = (await db.query('select bloqueado,cantidad_disponible from public.lotes where id=$1', [id])).rows[0];
    assert.equal(blocked.bloqueado, true);
    assert.equal(Number(blocked.cantidad_disponible), 10);
    await invalid(order(id));
    const allowed = await lot(), normalOrder = await order(allowed);
    await move(normalOrder, 'confirmado');
    await move(normalOrder, 'enviado');
    assert.equal((await db.query('select estado from public.pedidos where id=$1', [normalOrder])).rows[0].estado, 'enviado');
  });

  await t.test('RPC security definer fija search_path y nunca permite escritura vía helpers privados', async () => {
    const functions = (await db.query(`select p.proname,p.prosecdef,p.proconfig from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname in ('subir_certificado','revisar_certificado','solicitar_inspeccion_dron','completar_inspeccion_dron','registrar_test_residuos','estado_sello_lote')`)).rows;
    assert.equal(functions.length, 6);
    for (const fn of functions) { assert.equal(fn.prosecdef, true); assert.deepEqual(fn.proconfig, ['search_path=""']); }
    const id = await lot();
    await forbidden(as(admin, "select private.notificar_sello($1,'Aviso falso',true)", [id]));
    assert.equal(await noticeCount(id), 0);
  });
});

import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';

test('devoluciones: plazo de 7 días, respuesta del productor y revisión de la administración', async (t) => {
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

  const [producer, buyer, stranger, admin] = Array.from({ length: 4 }, randomUUID);
  for (const [id, rol] of [[producer, 'productor'], [buyer, 'comprador'], [stranger, 'comprador'], [admin, 'comprador']])
    await db.query('insert into auth.users(id,email,raw_user_meta_data,email_confirmed_at) values($1,$2,$3,now())', [id, `${id}@example.test`, JSON.stringify({ nombre_completo: 'Persona de Prueba', telefono: '999111222', rol, region: 'Piura', cultivo_principal: 'Mango' })]);
  await db.query("update public.perfiles set rol='admin' where id=$1", [admin]);
  async function as(user, sql, args = []) {
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user ?? '']);
    await db.exec(`set role ${user ? 'authenticated' : 'anon'}`);
    try { return await db.query(sql, args); } finally { await db.exec('reset role'); }
  }
  const forbidden = p => assert.rejects(p, e => e.code === '42501');
  const invalid = p => assert.rejects(p, e => e.code === '22023');
  const pedido = async id => (await db.query('select * from public.pedidos where id=$1', [id])).rows[0];
  const stock = async id => Number((await db.query('select cantidad_disponible from public.lotes where id=$1', [id])).rows[0].cantidad_disponible);
  const eventos = async id => (await db.query("select tipo from public.pedido_eventos where pedido_id=$1 and tipo like 'devolucion%' order by id", [id])).rows.map(r => r.tipo);
  const avisos = async (usuario, id) => (await db.query('select count(*)::int n from public.notificaciones where usuario_id=$1 and referencia_id=$2', [usuario, id])).rows[0].n;
  async function lote() {
    const id = randomUUID(), foto = `${producer}/${id}/${randomUUID()}.jpg`;
    await db.query("insert into storage.objects(bucket_id,name) values('fotos-lotes',$1)", [foto]);
    await db.query("insert into public.lotes(id,productor_id,cultivo,region,provincia,distrito,cantidad_disponible,unidad,precio_unidad,fotos,borrador) values($1,$2,'Palta Hass','Lima','Lima','Pachacamac',1000,'kg',5,$3,false)", [id, producer, [foto]]);
    return id;
  }
  // Pedido recibido y pagado contra entrega: 200 kg a S/ 5.
  async function recibido({ pagado = true } = {}) {
    const l = await lote();
    const id = (await as(buyer, 'select public.solicitar_compra($1,200,$2,$3,5,$4,null,$5,null) id', [l, 'Av. Los Frutales 120, Ate, Lima', randomUUID(), 'envio', 'contra_entrega'])).rows[0].id;
    await as(producer, "select public.cambiar_estado_pedido($1,'confirmado')", [id]);
    await as(producer, 'select public.registrar_despacho($1,null,null)', [id]);
    await as(buyer, "select public.cambiar_estado_pedido($1,'recibido')", [id]);
    if (pagado) await as(producer, 'select public.confirmar_pago($1)', [id]);
    return { id, lote: l };
  }
  const solicitar = (id, motivo = 'defecto', cantidad = 50, detalle = 'Cincuenta kilos llegaron golpeados.') =>
    as(buyer, 'select public.solicitar_devolucion($1,$2,$3,$4)', [id, motivo, cantidad, detalle]);

  await t.test('defecto aceptado y completado, sin tocar el stock', async () => {
    const { id, lote: l } = await recibido();
    const stockAntes = await stock(l);
    await forbidden(as(producer, "select public.solicitar_devolucion($1,'defecto',50,'Cincuenta kilos golpeados.')", [id]));
    await forbidden(as(stranger, "select public.solicitar_devolucion($1,'defecto',50,'Cincuenta kilos golpeados.')", [id]));
    await invalid(solicitar(id, 'otro'));
    await invalid(solicitar(id, 'defecto', 0));
    await invalid(solicitar(id, 'defecto', 201));
    await invalid(solicitar(id, 'defecto', 50, 'corto'));
    await solicitar(id);
    await solicitar(id); // reenvío idéntico sin efecto
    await invalid(solicitar(id, 'arrepentimiento'));
    let p = await pedido(id);
    assert.equal(p.devolucion_estado, 'solicitada'); assert.equal(Number(p.devolucion_cantidad), 50);
    assert.equal(Number(p.devolucion_monto), 250, '50 kg × S/ 5');

    await invalid(as(producer, 'select public.completar_devolucion($1)', [id]));
    await forbidden(as(buyer, "select public.responder_devolucion($1,true,null)", [id]));
    await as(producer, "select public.responder_devolucion($1,true,null)", [id]);
    await as(producer, "select public.responder_devolucion($1,true,null)", [id]); // reintento
    await invalid(as(producer, "select public.responder_devolucion($1,false,'Ya no corresponde')", [id]));
    await as(producer, 'select public.completar_devolucion($1)', [id]);
    await as(producer, 'select public.completar_devolucion($1)', [id]); // reintento
    p = await pedido(id);
    assert.equal(p.devolucion_estado, 'completada'); assert.ok(p.devolucion_completada_en);
    assert.equal(p.estado, 'recibido', 'el estado del pedido no cambia');
    assert.equal(await stock(l), stockAntes, 'la cosecha devuelta no vuelve al stock');
    assert.deepEqual(await eventos(id), ['devolucion_solicitada', 'devolucion_aceptada', 'devolucion_completada']);
  });

  await t.test('rechazo del productor y revisión de la administración', async () => {
    const { id } = await recibido();
    await solicitar(id, 'arrepentimiento', 200, 'Ya no necesito la cosecha completa.');
    await invalid(as(producer, "select public.responder_devolucion($1,false,'no')", [id]));
    await as(producer, "select public.responder_devolucion($1,false,'La cosecha se entregó conforme.')", [id]);
    assert.equal((await pedido(id)).devolucion_estado, 'rechazada');
    assert.ok(await avisos(admin, id) > 0, 'avisa a la administración');

    await forbidden(as(buyer, "select public.resolver_devolucion($1,true,'Procede la devolución completa.')", [id]));
    await forbidden(as(producer, "select public.resolver_devolucion($1,true,'Procede la devolución completa.')", [id]));
    await invalid(as(admin, "select public.resolver_devolucion($1,true,'corta')", [id]));
    await as(admin, "select public.resolver_devolucion($1,true,'Procede: el comprador avisó dentro del plazo.')", [id]);
    await as(admin, "select public.resolver_devolucion($1,true,'Procede: el comprador avisó dentro del plazo.')", [id]);
    await invalid(as(admin, "select public.resolver_devolucion($1,false,'Cambio de opinión de la administración.')", [id]));
    const p = await pedido(id);
    assert.equal(p.devolucion_estado, 'aceptada'); assert.ok(p.devolucion_revisada_en);
    assert.equal(Number(p.devolucion_monto), 1000);
    await as(producer, 'select public.completar_devolucion($1)', [id]);
    assert.deepEqual(await eventos(id), ['devolucion_solicitada', 'devolucion_rechazada', 'devolucion_aceptada', 'devolucion_completada']);
  });

  await t.test('plazo de 7 días, pago pendiente y pedidos que no aplican', async () => {
    const { id } = await recibido();
    await db.query("update public.pedidos set recibido_en = now() - interval '6 days 23 hours' where id=$1", [id]);
    await solicitar(id);

    const vencido = (await recibido()).id;
    await db.query("update public.pedidos set recibido_en = now() - interval '7 days 1 minute' where id=$1", [vencido]);
    await invalid(solicitar(vencido));

    // Sin pago confirmado no hay nada que reembolsar.
    const impago = (await recibido({ pagado: false })).id;
    await solicitar(impago);
    assert.equal(Number((await pedido(impago)).devolucion_monto), 0);

    // Antes de la recepción no se puede pedir.
    const l = await lote();
    const enCurso = (await as(buyer, 'select public.solicitar_compra($1,10,$2,$3,5,$4,null,$5,null) id', [l, 'Av. Los Frutales 120, Ate, Lima', randomUUID(), 'envio', 'contra_entrega'])).rows[0].id;
    await invalid(solicitar(enCurso, 'defecto', 5));

    // Pedidos del flujo anterior quedan fuera.
    await db.query('update public.pedidos set flujo = 1 where id=$1', [impago]);
    const antiguo = (await recibido()).id;
    await db.query('update public.pedidos set flujo = 1 where id=$1', [antiguo]);
    await invalid(solicitar(antiguo));

    // Nadie escribe las columnas directamente.
    await assert.rejects(as(buyer, "update public.pedidos set devolucion_estado='completada' where id=$1 returning id", [id]).then(r => { if (!r.rows.length) throw Object.assign(new Error('sin filas'), { code: '42501' }) }));
  });
});

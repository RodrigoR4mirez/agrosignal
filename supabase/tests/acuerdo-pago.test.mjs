import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';

test('flujo de compra: solicitud, contrapropuesta, acuerdo, pago, despacho, recepción y comprobante', async (t) => {
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
  const eventos = async id => (await db.query('select tipo from public.pedido_eventos where pedido_id=$1 order by id', [id])).rows.map(r => r.tipo);
  async function lote(cantidad = 1000, precio = 5) {
    const id = randomUUID(), foto = `${producer}/${id}/${randomUUID()}.jpg`;
    await db.query("insert into storage.objects(bucket_id,name) values('fotos-lotes',$1)", [foto]);
    await db.query("insert into public.lotes(id,productor_id,cultivo,region,provincia,distrito,cantidad_disponible,unidad,precio_unidad,fotos,borrador) values($1,$2,'Palta Hass','Lima','Lima','Pachacamac',$3,'kg',$4,$5,false)", [id, producer, cantidad, precio, [foto]]);
    return id;
  }
  async function documento(pedidoId, ext = 'pdf') {
    const ruta = `${pedidoId}/${randomUUID()}.${ext}`;
    await db.query("insert into storage.objects(bucket_id,name,metadata) values('documentos-pedido',$1,$2)", [ruta, { mimetype: ext === 'pdf' ? 'application/pdf' : 'image/jpeg', size: 1000 }]);
    return ruta;
  }
  const solicitar = (loteId, opts = {}) => as(buyer, 'select public.solicitar_compra($1,$2,$3,$4,$5,$6,$7,$8,$9) id',
    [loteId, opts.cantidad ?? 500, 'Av. Los Frutales 120, Ate, Lima', randomUUID(), opts.precio ?? 5, opts.entrega ?? 'envio', opts.fecha ?? null, opts.forma ?? 'antes_envio', 'Necesito calibre 18-20.']).then(r => r.rows[0].id);

  await t.test('pago antes del envío, con contrapropuesta', async () => {
    const l = await lote();
    const id = await solicitar(l);
    let p = await pedido(id);
    assert.equal(p.flujo, 2); assert.equal(p.forma_pago, 'antes_envio'); assert.equal(p.mensaje, 'Necesito calibre 18-20.');
    assert.equal(await stock(l), 1000, 'la solicitud no reserva stock');

    // Solo el productor del lote propone; la propuesta debe cambiar algo y respetar el stock.
    await forbidden(as(buyer, "select public.proponer_condiciones($1,4.5,500,null,'antes_envio','x')", [id]));
    await invalid(as(producer, "select public.proponer_condiciones($1,5,500,null,'antes_envio',null)", [id]));
    await invalid(as(producer, "select public.proponer_condiciones($1,4.5,5000,null,'antes_envio',null)", [id]));
    await as(producer, "select public.proponer_condiciones($1,4.8,400,null,'antes_envio','Tengo 400 kg de ese calibre')", [id]);
    // El comprador la rechaza y el productor vuelve a proponer; luego la acepta.
    await as(buyer, 'select public.responder_propuesta($1,false)', [id]);
    assert.equal((await pedido(id)).propuesta_en, null);
    await as(producer, "select public.proponer_condiciones($1,4.8,400,null,'antes_envio',null)", [id]);
    await forbidden(as(stranger, 'select public.responder_propuesta($1,true)', [id]));
    await as(buyer, 'select public.responder_propuesta($1,true)', [id]);
    p = await pedido(id);
    assert.equal(p.estado, 'confirmado'); assert.equal(Number(p.cantidad), 400); assert.equal(Number(p.precio_unidad), 4.8);
    assert.equal(Number(p.total), 1920); assert.ok(p.acordado_en); assert.equal(p.propuesta_en, null);
    assert.equal(await stock(l), 600, 'el acuerdo descuenta la cantidad pactada');

    // No se despacha sin pago confirmado cuando se pactó pagar antes.
    await invalid(as(producer, "select public.registrar_despacho($1,'T001-88','Transportes Lurín')", [id]));
    await invalid(as(buyer, "select public.informar_pago($1,'transferencia','0012345',null)", [id]));
    const ajeno = `${randomUUID()}/${randomUUID()}.pdf`;
    await db.query("insert into storage.objects(bucket_id,name,metadata) values('documentos-pedido',$1,$2)", [ajeno, { mimetype: 'application/pdf' }]);
    await invalid(as(buyer, "select public.informar_pago($1,'transferencia','0012345',$2)", [id, ajeno]));
    const voucher = await documento(id, 'jpg');
    await as(buyer, "select public.informar_pago($1,'transferencia','0012345',$2)", [id, voucher]);
    await forbidden(as(buyer, 'select public.confirmar_pago($1)', [id]));
    await as(producer, 'select public.confirmar_pago($1)', [id]);
    await as(producer, 'select public.confirmar_pago($1)', [id]); // reintento sin efecto
    await as(producer, "select public.registrar_despacho($1,'T001-88','Transportes Lurín')", [id]);
    p = await pedido(id);
    assert.equal(p.estado, 'enviado'); assert.equal(p.guia_remision, 'T001-88'); assert.ok(p.enviado_en);

    await as(buyer, "select public.cambiar_estado_pedido($1,'recibido')", [id]);
    // Factura: la registra el productor, con serie-número y archivo.
    await forbidden(as(buyer, "select public.registrar_comprobante($1,'factura','F001-245',$2)", [id, await documento(id)]));
    await invalid(as(producer, "select public.registrar_comprobante($1,'factura','245',$2)", [id, await documento(id)]));
    await as(producer, "select public.registrar_comprobante($1,'factura','f001-245',$2)", [id, await documento(id)]);
    await invalid(as(producer, "select public.registrar_comprobante($1,'boleta','B001-1',$2)", [id, await documento(id)]));
    assert.equal((await pedido(id)).comprobante_numero, 'F001-245');

    assert.deepEqual(await eventos(id), ['solicitud', 'propuesta', 'propuesta_rechazada', 'propuesta', 'acuerdo', 'pago_informado', 'pago_confirmado', 'enviado', 'recibido', 'comprobante']);
    // El historial solo lo ven las partes y la administración.
    assert.equal((await as(buyer, 'select * from public.pedido_eventos where pedido_id=$1', [id])).rows.length, 10);
    assert.equal((await as(admin, 'select * from public.pedido_eventos where pedido_id=$1', [id])).rows.length, 10);
    assert.equal((await as(stranger, 'select * from public.pedido_eventos where pedido_id=$1', [id])).rows.length, 0);
    await forbidden(as(buyer, "insert into public.pedido_eventos(pedido_id,tipo) values($1,'acuerdo')", [id]));
  });

  await t.test('contra entrega, observación y liquidación de compra del comprador', async () => {
    const l = await lote();
    const id = await solicitar(l, { forma: 'contra_entrega', entrega: 'recojo', cantidad: 200 });
    await as(producer, "select public.cambiar_estado_pedido($1,'confirmado')", [id]);
    await invalid(as(buyer, "select public.informar_pago($1,'efectivo',null,null)", [id]));
    await as(producer, "select public.registrar_despacho($1,null,null)", [id]);
    await as(buyer, "select public.informar_pago($1,'efectivo',null,null)", [id]);
    await as(buyer, "select public.cambiar_estado_pedido($1,'recibido')", [id]);
    await invalid(as(buyer, "select public.reportar_observacion($1,'corto')", [id]));
    await as(buyer, "select public.reportar_observacion($1,'Diez jabas llegaron con fruta golpeada.')", [id]);
    assert.ok((await db.query("select 1 from public.notificaciones where usuario_id=$1 and referencia_id=$2", [admin, id])).rows.length, 'avisa a la administración');
    await as(producer, 'select public.confirmar_pago($1)', [id]);
    await forbidden(as(producer, "select public.registrar_comprobante($1,'liquidacion_compra','E001-12',$2)", [id, await documento(id)]));
    await as(buyer, "select public.registrar_comprobante($1,'liquidacion_compra','E001-12',$2)", [id, await documento(id)]);
    assert.deepEqual(await eventos(id), ['solicitud', 'acuerdo', 'enviado', 'pago_informado', 'recibido', 'observacion', 'pago_confirmado', 'comprobante']);
  });

  await t.test('documentos privados y pedidos antiguos', async () => {
    const l = await lote();
    const id = await solicitar(l);
    const ruta = `${id}/${randomUUID()}.pdf`;
    await as(buyer, "insert into storage.objects(bucket_id,name,metadata) values('documentos-pedido',$1,'{}')", [ruta]);
    await assert.rejects(as(stranger, "insert into storage.objects(bucket_id,name,metadata) values('documentos-pedido',$1,'{}')", [`${id}/${randomUUID()}.pdf`]));
    assert.equal((await as(stranger, "select * from storage.objects where bucket_id='documentos-pedido' and name=$1", [ruta])).rows.length, 0);
    assert.equal((await as(producer, "select * from storage.objects where bucket_id='documentos-pedido' and name=$1", [ruta])).rows.length, 1);
    await db.query('update public.pedidos set flujo=1 where id=$1', [id]);
    await invalid(as(producer, "select public.proponer_condiciones($1,4,100,null,'antes_envio',null)", [id]));
    await invalid(as(buyer, "select public.solicitar_compra($1,10,'Av. Los Frutales 120, Ate',$2,5,'avion',null,'antes_envio',null)", [l, randomUUID()]));
  });
});

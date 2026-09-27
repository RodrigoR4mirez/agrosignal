import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';

test('favoritos, alertas, perfil del comprador e historial de precios', async (t) => {
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
  for (const file of ['20260926000100_esquema_inicial.sql', '20260926000200_storage.sql', '20260926000300_auth.sql', '20260926000400_marketplace.sql', '20260926000500_transacciones.sql', '20260926000600_sello_inocuidad.sql', '20260926000700_admin_panel.sql', '20260927000100_calificaciones.sql', '20260927000200_descuentos_foto_productor.sql', '20260927000300_perfil_productor.sql', '20260927000400_favoritos_comprador_precios.sql'])
    await db.exec(await readFile(new URL(`../migrations/${file}`, import.meta.url), 'utf8'));

  const [producer, otherProducer, buyer, fan, stranger] = Array.from({ length: 5 }, randomUUID);
  for (const [id, rol, nombre] of [[producer, 'productor', 'Rosa Quispe Mamani'], [otherProducer, 'productor', 'Luis Tello Ramos'], [buyer, 'comprador', 'Carlos Huamán Ríos'], [fan, 'comprador', 'Ana Torres Vega'], [stranger, 'comprador', 'Pedro Ruiz Soto']])
    await db.query('insert into auth.users(id,email,raw_user_meta_data,email_confirmed_at) values($1,$2,$3,now())', [id, `${id}@example.test`, JSON.stringify({ nombre_completo: nombre, telefono: '999111222', rol, region: 'Piura', cultivo_principal: 'Mango' })]);
  async function as(user, sql, args = []) {
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user ?? '']);
    await db.exec(`set role ${user ? 'authenticated' : 'anon'}`);
    try { return await db.query(sql, args); } finally { await db.exec('reset role'); }
  }
  const forbidden = promise => assert.rejects(promise, e => e.code === '42501');
  const avisos = async user => (await db.query("select mensaje from public.notificaciones where usuario_id=$1 and referencia_tipo='lote' order by creado_en", [user])).rows.map(r => r.mensaje);
  async function lote(owner, cultivo, precio) {
    const id = randomUUID(), foto = `${owner}/${id}/${randomUUID()}.jpg`;
    await db.query("insert into storage.objects(bucket_id,name) values('fotos-lotes',$1)", [foto]);
    await db.query("insert into public.lotes(id,productor_id,cultivo,region,provincia,distrito,cantidad_disponible,unidad,precio_unidad,fotos,borrador) values($1,$2,$3,'Piura','Piura','Castilla',1000,'kg',$4,$5,true)", [id, owner, cultivo, precio, [foto]]);
    return id;
  }
  const publicar = id => as(producer, 'update public.lotes set borrador=false where id=$1', [id]);

  // Favoritos: solo compradores siguen, y solo a productores.
  await as(fan, 'select public.seguir_productor($1, true)', [producer]);
  await as(fan, 'select public.seguir_productor($1, true)', [producer]);
  await forbidden(as(otherProducer, 'select public.seguir_productor($1, true)', [producer]));
  await forbidden(as(null, 'select public.seguir_productor($1, true)', [producer]));
  await assert.rejects(as(fan, 'select public.seguir_productor($1, true)', [buyer]), e => e.code === '22023');
  assert.equal((await as(null, 'select public.perfil_productor($1) p', [producer])).rows[0].p.seguidores, 1);
  assert.equal((await as(fan, 'select * from public.mis_productores_seguidos()')).rows[0].nombre, 'Rosa Quispe Mamani');
  assert.equal((await as(buyer, 'select * from public.favoritos')).rows.length, 0, 'no se ven los favoritos ajenos');
  await forbidden(as(fan, 'insert into public.favoritos(comprador_id, productor_id) values($1,$2)', [fan, otherProducer]));

  // Alertas: propias, únicas por cultivo y hasta 10.
  await as(buyer, "insert into public.alertas_precio(comprador_id, cultivo, precio_maximo_kg) values($1,'mango',3)", [buyer]);
  await as(fan, "insert into public.alertas_precio(comprador_id, cultivo) values($1,'Mango')", [fan]);
  await assert.rejects(as(buyer, "insert into public.alertas_precio(comprador_id, cultivo) values($1,'MANGO ')", [buyer]), e => e.code === '23505');
  await forbidden(as(buyer, "insert into public.alertas_precio(comprador_id, cultivo) values($1,'palta')", [fan]));
  await forbidden(as(producer, "insert into public.alertas_precio(comprador_id, cultivo) values($1,'palta')", [producer]));
  for (let i = 0; i < 9; i++) await as(stranger, "insert into public.alertas_precio(comprador_id, cultivo) values($1,$2)", [stranger, `cultivo ${i}`]);
  await as(stranger, "insert into public.alertas_precio(comprador_id, cultivo) values($1,'uva')", [stranger]);
  await assert.rejects(as(stranger, "insert into public.alertas_precio(comprador_id, cultivo) values($1,'papa')", [stranger]), e => e.code === '22023');
  assert.equal((await as(fan, 'select * from public.alertas_precio')).rows.length, 1);

  // Avisos: al publicar (seguidores y alertas dentro del precio) y al bajar el precio.
  const mango = await lote(producer, 'Mango Kent', 3.5);
  await publicar(mango);
  assert.deepEqual(await avisos(fan), ['Rosa Quispe Mamani publicó Mango Kent a S/ 3.50 por kg.'], 'el seguidor recibe un solo aviso aunque tenga alerta');
  assert.deepEqual(await avisos(buyer), [], 'precio sobre el máximo de su alerta');
  await as(producer, 'update public.lotes set precio_unidad=2.8 where id=$1', [mango]);
  assert.equal((await avisos(fan)).at(-1), 'Rosa Quispe Mamani bajó el precio de Mango Kent a S/ 2.80 por kg.');
  assert.equal((await avisos(buyer)).at(-1), 'Alerta de mango: Mango Kent a S/ 2.80 por kg en Piura.');
  const cantidad = (await avisos(fan)).length;
  await as(producer, 'update public.lotes set precio_unidad=3.9 where id=$1', [mango]);
  assert.equal((await avisos(fan)).length, cantidad, 'subir el precio no avisa');

  // Historial: publicación, cambios de precio y venta recibida.
  const pedido = (await as(buyer, 'select public.crear_pedido($1,10,$2,$3,3.9) id', [mango, 'Av. Agricultores 100, Piura', randomUUID()])).rows[0].id;
  for (const [estado, actor] of [['confirmado', producer], ['enviado', producer], ['recibido', buyer]]) await as(actor, 'select public.cambiar_estado_pedido($1,$2)', [pedido, estado]);
  const serie = (await as(null, "select * from public.historial_precio_cultivo('mango')")).rows;
  assert.equal(serie.length, 1);
  assert.equal(serie[0].publicaciones, 3);
  assert.equal(serie[0].ventas, 1);
  assert.equal(Number(serie[0].vendido), 3.9);
  assert.equal(Number(serie[0].minimo), 2.8);
  assert.equal((await as(null, 'select * from public.cultivos_con_precios()')).rows[0].nombre, 'Mango');
  await forbidden(as(null, 'select * from public.historial_precios'));

  // Perfil del comprador: él mismo, o productores con pedidos suyos.
  await as(buyer, "update public.perfiles set empresa='Frutas del Norte SAC', rubro='Distribución mayorista', cultivos_interes='{Mango,Limón}', volumen_mensual_kg=20000, mercados_destino='{Lima,Trujillo}' where id=$1", [buyer]);
  await as(producer, 'select public.calificar_pedido($1,5,$2)', [pedido, 'Pago puntual.']);
  await as(buyer, 'select public.calificar_pedido($1,5,$2)', [pedido, 'Buen mango.']);
  const perfil = (await as(producer, 'select public.perfil_comprador($1) p', [buyer])).rows[0].p;
  assert.equal(perfil.empresa, 'Frutas del Norte SAC');
  assert.equal(perfil.pedidos_completados, 1);
  assert.equal(perfil.reputacion.total, 1);
  assert.equal(perfil.resenas[0].comentario, 'Pago puntual.');
  assert.equal(perfil.resenas[0].autor, 'Rosa Q.');
  assert.equal((await as(buyer, 'select public.perfil_comprador($1) p', [buyer])).rows[0].p.nombre, 'Carlos Huamán Ríos');
  await forbidden(as(otherProducer, 'select public.perfil_comprador($1) p', [buyer]));
  await forbidden(as(fan, 'select public.perfil_comprador($1) p', [buyer]));
  await forbidden(as(null, 'select public.perfil_comprador($1) p', [buyer]));
  await forbidden(as(buyer, "update public.perfiles set rol='admin' where id=$1", [buyer]));
});

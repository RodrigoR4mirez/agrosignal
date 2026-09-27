begin;

-- Mensajes del formulario "Contáctanos". Cualquiera puede enviar uno (con o sin sesión) a través
-- de enviar_mensaje_contacto; solo la administración los lee y los marca como atendidos.
create table public.mensajes_contacto (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(btrim(nombre)) between 2 and 120),
  correo text not null check (correo ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(correo) <= 160),
  telefono text check (telefono is null or char_length(telefono) <= 30),
  perfil text not null check (perfil in ('productor', 'comprador', 'empresa', 'otro')),
  asunto text not null check (asunto in ('vender', 'comprar', 'verificacion', 'cuenta', 'alianzas', 'otro')),
  mensaje text not null check (char_length(btrim(mensaje)) between 10 and 2000),
  usuario_id uuid references public.perfiles(id) on delete set null,
  atendido boolean not null default false,
  creado_en timestamptz not null default now()
);
create index mensajes_contacto_recientes on public.mensajes_contacto(creado_en desc);
alter table public.mensajes_contacto enable row level security;
revoke all on public.mensajes_contacto from anon, authenticated;
grant select, update (atendido) on public.mensajes_contacto to authenticated;
create policy mensajes_contacto_admin_lee on public.mensajes_contacto for select to authenticated using (private.es_admin());
create policy mensajes_contacto_admin_atiende on public.mensajes_contacto for update to authenticated
  using (private.es_admin()) with check (private.es_admin());

-- Límite contra spam: 3 mensajes por correo cada 10 minutos y 60 en total por hora.
create function public.enviar_mensaje_contacto(p_nombre text, p_correo text, p_telefono text, p_perfil text,
  p_asunto text, p_mensaje text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_correo text := lower(btrim(coalesce(p_correo, '')));
begin
  if (select count(*) from public.mensajes_contacto where correo = v_correo and creado_en > now() - interval '10 minutes') >= 3
    or (select count(*) from public.mensajes_contacto where creado_en > now() - interval '1 hour') >= 60 then
    raise exception 'Recibimos varios mensajes seguidos. Espera unos minutos e inténtalo de nuevo.' using errcode = '54000';
  end if;
  insert into public.mensajes_contacto(nombre, correo, telefono, perfil, asunto, mensaje, usuario_id)
  values (btrim(p_nombre), v_correo, nullif(btrim(coalesce(p_telefono, '')), ''), p_perfil, p_asunto, btrim(p_mensaje), auth.uid())
  returning id into v_id;
  insert into public.notificaciones(usuario_id, mensaje, referencia_tipo, referencia_id)
  select p.id, 'Nuevo mensaje de contacto de ' || btrim(p_nombre) || '.', 'contacto', v_id
  from public.perfiles p where p.rol = 'admin' and not p.suspendido;
  return v_id;
exception when check_violation then
  raise exception 'Revisa los datos del formulario.' using errcode = '22023';
end;
$$;
revoke all on function public.enviar_mensaje_contacto(text, text, text, text, text, text) from public;
grant execute on function public.enviar_mensaje_contacto(text, text, text, text, text, text) to anon, authenticated;

commit;

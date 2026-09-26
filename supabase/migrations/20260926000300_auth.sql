begin;

-- Public metadata can select only the two public roles. Admins are assigned
-- manually through trusted database administration, never via signup metadata.
create function private.crear_perfil() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  datos jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  rol_publico public.rol_usuario;
  nombre text;
  comprador public.tipo_comprador;
begin
  rol_publico := case when datos->>'rol' = 'productor' then 'productor'::public.rol_usuario
    else 'comprador'::public.rol_usuario end;
  nombre := left(btrim(coalesce(nullif(datos->>'nombre_completo', ''), split_part(new.email, '@', 1), 'Usuario')), 120);
  if char_length(nombre) < 2 then nombre := 'Usuario'; end if;
  comprador := case when datos->>'tipo_comprador' in ('natural', 'empresa', 'exportador')
    then (datos->>'tipo_comprador')::public.tipo_comprador else 'natural'::public.tipo_comprador end;
  if rol_publico = 'productor' and (
    coalesce(char_length(btrim(datos->>'region')), 0) < 2
    or coalesce(char_length(btrim(datos->>'cultivo_principal')), 0) < 2
  ) then
    raise exception 'Indica tu región y cultivo principal.' using errcode = '22023';
  end if;
  insert into public.perfiles (
    id, nombre_completo, telefono, rol, region, cultivo_principal,
    tipo_comprador, destino_exportacion, suspendido
  ) values (
    new.id, nombre, left(coalesce(datos->>'telefono', ''), 30), rol_publico,
    case when rol_publico = 'productor' then left(btrim(datos->>'region'), 80) end,
    case when rol_publico = 'productor' then left(btrim(datos->>'cultivo_principal'), 100) end,
    case when rol_publico = 'comprador' then comprador end,
    case when rol_publico = 'comprador' then coalesce(datos->>'destino_exportacion' = 'true', false) end,
    false
  );
  return new;
end;
$$;

revoke all on function private.crear_perfil() from public, anon, authenticated;
create trigger crear_perfil_usuario after insert on auth.users
  for each row execute function private.crear_perfil();

-- Changing user_metadata afterwards does not change the stored profile role.
-- No INSERT/UPDATE grant on perfiles is exposed to public clients.
comment on column public.perfiles.rol is 'Fuente de autorización; admin solo por administración segura de BD.';

commit;

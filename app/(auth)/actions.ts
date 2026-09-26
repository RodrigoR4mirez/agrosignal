'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/supabase/auth'
import { getSiteUrl } from '@/lib/supabase/site-url'
import { ROLE_HOME, safeNext, type ActionState, type UserRole } from '@/lib/supabase/types'

function text(form: FormData, key: string) { return String(form.get(key) ?? '').trim() }
function validEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254 }
function passwordError(value: string) {
  return value.length < 10 || value.length > 128 || !/[a-zA-Z]/.test(value) || !/\d/.test(value)
    ? 'Usa entre 10 y 128 caracteres, con al menos una letra y un número.' : null
}

function authError(error: { code?: string; status?: number }, fallback: string) {
  if (error.status === 429 || error.code?.includes('rate_limit')) return 'Espera unos minutos antes de volver a intentarlo.'
  if (error.code === 'email_not_confirmed') return 'Confirma tu correo con el enlace que recibiste antes de ingresar.'
  if (error.code === 'invalid_credentials') return 'El correo o la contraseña no coinciden. Revísalos e intenta otra vez.'
  if (error.code === 'weak_password') return 'Elige una contraseña más segura, con letras y números.'
  if (error.code === 'same_password') return 'La contraseña nueva debe ser diferente a la anterior.'
  if (error.code === 'email_address_not_authorized' || error.code === 'email_address_invalid') return 'No pudimos enviar el correo. Intenta más tarde o consulta la sección de Ayuda.'
  return fallback
}

export async function registerAction(_state: ActionState, form: FormData): Promise<ActionState> {
  const email = text(form, 'email').toLowerCase()
  const password = String(form.get('password') ?? '')
  const nombre_completo = text(form, 'nombre_completo')
  const telefono = text(form, 'telefono')
  const rol = text(form, 'rol')
  if (!['productor', 'comprador'].includes(rol)) return { error: 'Elige si quieres vender o comprar.' }
  if (!validEmail(email)) return { error: 'Escribe un correo válido.' }
  if (nombre_completo.length < 2 || nombre_completo.length > 120) return { error: 'Escribe tu nombre completo (de 2 a 120 caracteres).' }
  if (!/^[+\d\s()-]{7,30}$/.test(telefono)) return { error: 'Escribe un teléfono válido de al menos 7 caracteres.' }
  const invalidPassword = passwordError(password)
  if (invalidPassword) return { error: invalidPassword }
  if (password !== String(form.get('password_confirm') ?? '')) return { error: 'Las contraseñas no coinciden.' }
  const region = text(form, 'region')
  const cultivo_principal = text(form, 'cultivo_principal')
  const tipo_comprador = text(form, 'tipo_comprador')
  if (rol === 'productor' && (region.length < 2 || region.length > 80 || cultivo_principal.length < 2 || cultivo_principal.length > 100)) {
    return { error: 'Indica tu región y tu cultivo principal.' }
  }
  if (rol === 'comprador' && !['natural', 'empresa', 'exportador'].includes(tipo_comprador)) return { error: 'Selecciona tu tipo de comprador.' }
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${await getSiteUrl()}/auth/callback`,
        data: { nombre_completo, telefono, rol, region: rol === 'productor' ? region : null,
          cultivo_principal: rol === 'productor' ? cultivo_principal : null,
          tipo_comprador: rol === 'comprador' ? tipo_comprador : null,
          destino_exportacion: rol === 'comprador' ? form.get('destino_exportacion') === 'on' : null },
      },
    })
    if (error) return { error: authError(error, 'No pudimos crear la cuenta. Revisa tus datos e inténtalo de nuevo.') }
  } catch { return { error: 'No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.' } }
  redirect('/verificar-correo?enviado=1')
}

export async function loginAction(_state: ActionState, form: FormData): Promise<ActionState> {
  const email = text(form, 'email').toLowerCase()
  const password = String(form.get('password') ?? '')
  if (!validEmail(email) || !password) return { error: 'Escribe tu correo y contraseña.' }
  let destination = '/mi-cuenta'
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: authError(error, 'No pudimos iniciar sesión. Inténtalo de nuevo.') }
    const { data: profile } = await supabase.from('perfiles').select('rol,suspendido').eq('id', data.user.id).single()
    if (!profile) {
      await supabase.auth.signOut({ scope: 'local' })
      return { error: 'No pudimos cargar tu perfil. Inténtalo de nuevo o consulta Ayuda.' }
    }
    if (profile.suspendido) destination = '/cuenta-suspendida'
    else if (!data.user.email_confirmed_at) destination = '/verificar-correo'
    else destination = safeNext(text(form, 'next'), ROLE_HOME[profile.rol as UserRole])
  } catch { return { error: 'No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.' } }
  revalidatePath('/', 'layout')
  redirect(destination)
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut({ scope: 'local' })
  revalidatePath('/', 'layout')
  redirect('/login?aviso=salida')
}

export async function recoverAction(_state: ActionState, form: FormData): Promise<ActionState> {
  const email = text(form, 'email').toLowerCase()
  if (!validEmail(email)) return { error: 'Escribe un correo válido.' }
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${await getSiteUrl()}/auth/callback?next=/actualizar-password`,
    })
    if (error) return { error: authError(error, 'No pudimos enviar el enlace. Inténtalo en unos minutos.') }
    return { success: 'Si el correo tiene una cuenta, recibirás un enlace para cambiar tu contraseña. Revisa también la carpeta de spam.' }
  } catch { return { error: 'No pudimos conectar. Inténtalo de nuevo en unos minutos.' } }
}

export async function resendAction(_state: ActionState, form: FormData): Promise<ActionState> {
  const email = text(form, 'email').toLowerCase()
  if (!validEmail(email)) return { error: 'Escribe un correo válido.' }
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: `${await getSiteUrl()}/auth/callback` } })
    if (error) return { error: authError(error, 'No pudimos reenviar el enlace. Inténtalo en unos minutos.') }
    return { success: 'Si tu cuenta espera confirmación, recibirás un nuevo enlace. Revisa también la carpeta de spam.' }
  } catch { return { error: 'No pudimos conectar. Inténtalo de nuevo en unos minutos.' } }
}

export async function updatePasswordAction(_state: ActionState, form: FormData): Promise<ActionState> {
  await requireRole()
  const password = String(form.get('password') ?? '')
  const invalid = passwordError(password)
  if (invalid) return { error: invalid }
  if (password !== String(form.get('password_confirm') ?? '')) return { error: 'Las contraseñas no coinciden.' }
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return { error: authError(error, 'No pudimos cambiar la contraseña. Solicita un nuevo enlace e inténtalo otra vez.') }
    await supabase.auth.signOut({ scope: 'global' })
  } catch { return { error: 'No pudimos conectar. Inténtalo de nuevo.' } }
  revalidatePath('/', 'layout')
  redirect('/login?aviso=password')
}

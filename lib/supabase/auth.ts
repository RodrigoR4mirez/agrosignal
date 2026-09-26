import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from './server'
import { ROLE_HOME, type Profile, type UserRole } from './types'

/** Cached only for the current React render, never across requests/users. */
export const getProfile = cache(async (): Promise<Profile | null> => {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null
    const { data } = await supabase.from('perfiles').select('*').eq('id', user.id).single()
    if (!data) return null
    return { ...data, email: user.email ?? '', email_confirmed: Boolean(user.email_confirmed_at) } as Profile
  } catch { return null }
})

/** Call inside EVERY protected page, Server Action and Route Handler. */
export async function requireRole(roles?: UserRole | UserRole[]): Promise<Profile> {
  const profile = await getProfile()
  if (!profile) redirect('/login?aviso=sesion')
  if (profile.suspendido) redirect('/cuenta-suspendida')
  if (!profile.email_confirmed) redirect('/verificar-correo')
  const allowed = roles ? (Array.isArray(roles) ? roles : [roles]) : null
  if (allowed && !allowed.includes(profile.rol)) redirect(`${ROLE_HOME[profile.rol]}?aviso=sin-permiso`)
  return profile
}

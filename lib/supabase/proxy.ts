import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { ROLE_HOME, type UserRole } from './types'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values) {
        values.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    } },
  )
  // getUser checks the current server-side identity, including email verification.
  const { data: { user } } = await supabase.auth.getUser()
  response.headers.set('Cache-Control', 'private, no-store')
  function redirectTo(path: string) {
    const result = NextResponse.redirect(new URL(path, request.url))
    response.cookies.getAll().forEach(cookie => result.cookies.set(cookie))
    result.headers.set('Cache-Control', 'private, no-store')
    return result
  }
  const path = request.nextUrl.pathname
  const requiredRole: UserRole | undefined =
    /^\/admin(?:\/|$)/.test(path) ? 'admin' :
    /^\/panel-productor(?:\/|$)/.test(path) || path === '/marketplace/publicar' || /^\/marketplace\/[^/]+\/editar$/.test(path) ? 'productor' :
    /^\/panel-comprador(?:\/|$)/.test(path) ? 'comprador' : undefined
  const protectedRoute = Boolean(requiredRole) || ['/mi-cuenta', '/actualizar-password'].includes(path)
  if (!user) return protectedRoute ? redirectTo(`/login?aviso=sesion&next=${encodeURIComponent(path)}`) : response
  if (!protectedRoute) return response
  const { data: profile } = await supabase.from('perfiles').select('rol,suspendido').eq('id', user.id).single()
  if (!profile) return redirectTo('/login?aviso=perfil')
  if (profile.suspendido) return redirectTo('/cuenta-suspendida')
  if (!user.email_confirmed_at) return redirectTo('/verificar-correo')
  if (requiredRole && requiredRole !== profile.rol) {
    return redirectTo(`${ROLE_HOME[profile.rol as UserRole]}?aviso=sin-permiso`)
  }
  return response
}

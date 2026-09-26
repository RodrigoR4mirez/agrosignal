import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    '/login', '/registro', '/recuperar-password', '/actualizar-password',
    '/verificar-correo', '/cuenta-suspendida', '/mi-cuenta', '/auth/:path*',
    '/panel-productor/:path*', '/panel-comprador/:path*', '/admin/:path*', '/marketplace/:path*', '/verificaciones/:path*',
  ],
}

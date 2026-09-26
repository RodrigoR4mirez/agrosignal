import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeNext } from '@/lib/supabase/types'

/** Supports Supabase's token-hash email templates, including another device. */
export async function GET(request: NextRequest) {
  const token_hash = request.nextUrl.searchParams.get('token_hash')
  const type = request.nextUrl.searchParams.get('type')
  if (token_hash && (type === 'signup' || type === 'email' || type === 'recovery')) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) {
      const target = type === 'recovery' ? '/actualizar-password' : safeNext(request.nextUrl.searchParams.get('next'))
      return NextResponse.redirect(new URL(target, request.url))
    }
  }
  return NextResponse.redirect(new URL('/login?aviso=enlace', request.url))
}

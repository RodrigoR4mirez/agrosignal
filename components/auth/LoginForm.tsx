'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { loginAction } from '@/app/(auth)/actions'
import { buttonClass, Field, FormMessage } from './FormFields'

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(loginAction, {})
  const [email, setEmail] = useState('')
  return <form action={action} className="space-y-5">
    <FormMessage state={state} />
    <input type="hidden" name="next" value={next ?? ''} />
    <Field label="Correo electrónico" name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} />
    <Field label="Contraseña" name="password" type="password" autoComplete="current-password" required maxLength={128} />
    <Link href="/recuperar-password" className="inline-block text-sm font-semibold text-[#1a5c2a] underline underline-offset-4">Olvidé mi contraseña</Link>
    <button className={`${buttonClass} w-full`} disabled={pending}>{pending ? 'Ingresando…' : 'Ingresar'}</button>
  </form>
}

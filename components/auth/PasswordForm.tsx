'use client'

import { useActionState } from 'react'
import { updatePasswordAction } from '@/app/(auth)/actions'
import { buttonClass, Field, FormMessage } from './FormFields'

export function PasswordForm() {
  const [state, action, pending] = useActionState(updatePasswordAction, {})
  return <form action={action} className="space-y-5">
    <FormMessage state={state} />
    <Field label="Nueva contraseña" name="password" type="password" autoComplete="new-password" required minLength={10} maxLength={128} hint="Al menos 10 caracteres, una letra y un número." />
    <Field label="Repite la nueva contraseña" name="password_confirm" type="password" autoComplete="new-password" required minLength={10} maxLength={128} />
    <p className="text-sm text-gray-600">Al guardarla cerraremos tus sesiones. Después podrás ingresar con tu contraseña nueva.</p>
    <button className={`${buttonClass} w-full`} disabled={pending}>{pending ? 'Guardando…' : 'Guardar contraseña'}</button>
  </form>
}

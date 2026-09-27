'use client'

import { useActionState, useEffect, useRef, type InputHTMLAttributes } from 'react'
import type { ActionState } from '@/lib/supabase/types'

export const inputClass = 'w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-base outline-none focus:border-petroleo focus:ring-2 focus:ring-petroleo/20 disabled:bg-gray-100'
export const buttonClass = 'inline-flex min-h-11 items-center justify-center rounded-full bg-naranja px-6 py-3 text-sm font-semibold text-petroleo transition hover:bg-[#f29a5e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-petroleo disabled:cursor-wait disabled:opacity-60'

export function Field({ label, hint, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const id = props.id ?? props.name
  return <div className="space-y-2">
    <label htmlFor={id} className="block text-sm font-semibold text-gray-800">{label}</label>
    <input {...props} id={id} className={inputClass} aria-describedby={hint ? `${id}-hint` : undefined} />
    {hint && <p id={`${id}-hint`} className="text-xs leading-relaxed text-gray-600">{hint}</p>}
  </div>
}

export function FormMessage({ state }: { state: ActionState }) {
  const message = useRef<HTMLParagraphElement>(null)
  useEffect(() => { if (state.error) message.current?.focus() }, [state])
  if (state.error) return <p ref={message} tabIndex={-1} role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-relaxed text-red-800">{state.error}</p>
  if (state.success) return <p role="status" className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm leading-relaxed text-green-900">{state.success}</p>
  return null
}

export function EmailForm({ action, label }: {
  action: (state: ActionState, form: FormData) => Promise<ActionState>; label: string
}) {
  const [state, formAction, pending] = useActionState(action, {})
  return <form action={formAction} className="space-y-5">
    <FormMessage state={state} />
    <Field label="Correo electrónico" name="email" type="email" autoComplete="email" required maxLength={254} />
    <button className={`${buttonClass} w-full`} disabled={pending}>{pending ? 'Enviando…' : label}</button>
  </form>
}

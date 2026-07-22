'use client'

import { useState, type FormEvent } from 'react'
import { WEB3FORMS_ACCESS_KEY, WEB3FORMS_ENDPOINT } from '../_lib/config'
import { MaterialSymbol } from './shared/MaterialSymbol'

type Status = 'idle' | 'loading' | 'success' | 'error'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const digits = whatsapp.replace(/\D/g, '')
  const emailFilled = email.trim().length > 0
  const whatsappFilled = digits.length > 0
  const emailValid = !emailFilled || EMAIL_REGEX.test(email.trim())
  const whatsappValid = !whatsappFilled || digits.length === 9

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!emailFilled && !whatsappFilled) {
      setStatus('error')
      setErrorMsg('Ingresa tu email o tu WhatsApp para que podamos contactarte.')
      return
    }
    if (!emailValid) {
      setStatus('error')
      setErrorMsg('Ingresa un email válido.')
      return
    }
    if (!whatsappValid) {
      setStatus('error')
      setErrorMsg('El WhatsApp debe tener 9 dígitos (ej. 999 999 999).')
      return
    }

    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch(WEB3FORMS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: 'Nuevo registro lista de espera - AgroSignal PRO',
          from_name: 'AgroSignal Web',
          email: emailFilled ? email.trim() : '(no proporcionado)',
          whatsapp: whatsappFilled ? `+51 ${digits}` : '(no proporcionado)',
          botcheck: '',
        }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setStatus('success')
      } else {
        setStatus('error')
        setErrorMsg(data.message || 'No se pudo enviar tu registro. Intenta nuevamente.')
      }
    } catch {
      setStatus('error')
      setErrorMsg('No se pudo conectar. Revisa tu internet e intenta nuevamente.')
    }
  }

  if (status === 'success') {
    return (
      <div
        id="lista-espera"
        className="pro-glass-card max-w-md space-y-3 rounded-2xl border-l-4 border-[var(--pro-primary)] p-6 shadow-xl"
      >
        <div className="flex items-center gap-2 text-[var(--pro-primary)]">
          <MaterialSymbol name="check_circle" filled className="!text-3xl" />
          <h3 className="text-xl leading-7 font-semibold">¡Listo! Ya estás en la lista</h3>
        </div>
        <p className="text-sm leading-5 text-[var(--pro-on-surface-variant)]">
          Nos pondremos en contacto contigo por email o WhatsApp para darte acceso prioritario apenas abramos cupos.
        </p>
      </div>
    )
  }

  return (
    <div
      id="lista-espera"
      className="pro-glass-card max-w-md space-y-4 rounded-2xl border-l-4 border-[var(--pro-secondary)] p-6 shadow-xl"
    >
      <h3 className="flex items-center gap-2 text-xl leading-7 font-semibold text-[var(--pro-on-surface)]">
        <MaterialSymbol name="hourglass_top" className="text-[var(--pro-secondary)]" />
        Gran lista de espera
      </h3>
      <form className="space-y-3" onSubmit={handleSubmit} noValidate>
        <p className="mb-4 text-sm leading-5 text-[var(--pro-on-surface-variant)]">
          Únete a nuestra lista de espera. Déjanos tu email o tu WhatsApp (o ambos) y nos pondremos en contacto
          contigo para darte acceso prioritario.
        </p>

        <div className="flex flex-col gap-1">
          <label className="px-1 text-xs leading-4 font-bold text-[var(--pro-on-surface-variant)]" htmlFor="pro-email">
            Email
          </label>
          <div className="relative">
            <input
              className="h-12 w-full rounded-xl border border-[var(--pro-outline-variant)] bg-[var(--pro-surface)] pl-10 pr-3 text-[var(--pro-on-surface)] transition-all outline-none focus:border-[var(--pro-primary)] focus:ring-2 focus:ring-[var(--pro-primary)]/20"
              id="pro-email"
              name="email"
              placeholder="nombre@empresa.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === 'loading'}
            />
            <MaterialSymbol
              name="mail"
              className="absolute top-1/2 left-3 -translate-y-1/2 text-[var(--pro-outline)]"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="px-1 text-xs leading-4 font-bold text-[var(--pro-on-surface-variant)]" htmlFor="pro-whatsapp">
            WhatsApp (Perú)
          </label>
          <div className="flex gap-2">
            <div className="flex h-12 items-center gap-2 rounded-xl border border-[var(--pro-outline-variant)] bg-[var(--pro-surface-container)] px-3">
              <span className="text-lg">🇵🇪</span>
              <span className="text-sm leading-5">+51</span>
            </div>
            <input
              className="h-12 flex-1 rounded-xl border border-[var(--pro-outline-variant)] bg-[var(--pro-surface)] px-3 text-[var(--pro-on-surface)] transition-all outline-none focus:border-[var(--pro-primary)] focus:ring-2 focus:ring-[var(--pro-primary)]/20"
              id="pro-whatsapp"
              inputMode="numeric"
              name="whatsapp"
              placeholder="999 999 999"
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              disabled={status === 'loading'}
            />
          </div>
        </div>

        {/* Honeypot anti-spam de Web3Forms */}
        <input type="checkbox" name="botcheck" className="hidden" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

        {status === 'error' && (
          <p className="rounded-xl bg-[var(--pro-error-container)] px-3 py-2 text-sm leading-5 text-[var(--pro-on-error-container)]">
            {errorMsg}
          </p>
        )}

        <div className="pt-2">
          <button
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--pro-primary)] text-xs leading-4 font-bold text-[var(--pro-on-primary)] transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? (
              <>
                <MaterialSymbol name="progress_activity" className="animate-spin !text-base" />
                Enviando...
              </>
            ) : (
              'Solicitar Prioridad'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

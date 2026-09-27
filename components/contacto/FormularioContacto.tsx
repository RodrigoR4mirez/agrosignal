'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { enviarContactoAction } from '@/app/contacto/actions'
import { ASUNTOS_CONTACTO, PERFILES_CONTACTO, type ContactoState } from '@/lib/contacto/types'

const campo = 'w-full rounded-2xl border border-[#e2dbc9] bg-white/90 px-4 py-3 text-[15px] text-gray-900 placeholder:text-gray-400 transition focus:border-petroleo focus:outline-none focus:ring-4 focus:ring-petroleo/10'
const etiqueta = 'mb-1.5 block text-[13px] font-semibold text-petroleo'

// Formulario de contacto sobre una tarjeta de vidrio; al enviarse muestra una confirmación.
export function FormularioContacto() {
  const [envio, setEnvio] = useState(0)
  return <Formulario key={envio} onOtro={() => setEnvio(n => n + 1)} />
}

function Formulario({ onOtro }: { onOtro: () => void }) {
  const [state, action, pending] = useActionState<ContactoState, FormData>(enviarContactoAction, {})
  const v = state.campos ?? {}
  if (state.success) return <div role="status" className="flex min-h-[28rem] flex-col items-center justify-center text-center">
    <span className="grid size-16 place-items-center rounded-full bg-musgo/15 text-musgo"><svg viewBox="0 0 24 24" aria-hidden="true" className="size-8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>
    <h2 className="mt-6 text-2xl font-normal text-petroleo">Mensaje enviado</h2>
    <p className="mt-3 max-w-sm text-sm leading-relaxed text-gray-600">{state.success}</p>
    <div className="mt-8 flex flex-wrap justify-center gap-3">
      <button type="button" onClick={onOtro} className="rounded-full border border-petroleo/25 px-5 py-2.5 text-sm font-semibold text-petroleo hover:bg-crema">Enviar otro mensaje</button>
      <Link href="/marketplace" className="rounded-full bg-naranja px-5 py-2.5 text-sm font-semibold text-petroleo hover:bg-[#f29a5e]">Ver productos</Link>
    </div>
  </div>

  return <form action={action} className="space-y-5">
    <div>
      <h2 className="text-2xl font-normal text-petroleo">Escríbenos</h2>
      <p className="mt-1 text-sm text-gray-600">Los campos con * son obligatorios.</p>
    </div>
    <div className="grid gap-5 sm:grid-cols-2">
      <div><label htmlFor="nombre" className={etiqueta}>Nombre completo *</label><input id="nombre" name="nombre" required minLength={2} maxLength={120} autoComplete="name" defaultValue={v.nombre} className={campo} /></div>
      <div><label htmlFor="correo" className={etiqueta}>Correo electrónico *</label><input id="correo" name="correo" type="email" required maxLength={160} autoComplete="email" defaultValue={v.correo} className={campo} /></div>
      <div><label htmlFor="telefono" className={etiqueta}>Teléfono o WhatsApp</label><input id="telefono" name="telefono" type="tel" maxLength={30} autoComplete="tel" placeholder="Opcional" defaultValue={v.telefono} className={campo} /></div>
      <div><label htmlFor="perfil" className={etiqueta}>¿Quién eres? *</label><select id="perfil" name="perfil" required defaultValue={v.perfil ?? ''} className={campo}><option value="" disabled>Elige una opción</option>{Object.entries(PERFILES_CONTACTO).map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}</select></div>
    </div>
    <fieldset>
      <legend className={etiqueta}>Motivo *</legend>
      <div className="flex flex-wrap gap-2">{Object.entries(ASUNTOS_CONTACTO).map(([valor, texto]) => <label key={valor} className="relative cursor-pointer rounded-full px-4 py-2 text-sm text-gray-700 ring-1 ring-[#e2dbc9] transition hover:ring-petroleo/40 has-checked:bg-petroleo has-checked:font-semibold has-checked:text-white has-checked:ring-petroleo has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-petroleo">
        <input type="radio" name="asunto" value={valor} required defaultChecked={v.asunto === valor} className="sr-only" />{texto}
      </label>)}</div>
    </fieldset>
    <div><label htmlFor="mensaje" className={etiqueta}>Mensaje *</label><textarea id="mensaje" name="mensaje" required minLength={10} maxLength={2000} rows={5} defaultValue={v.mensaje} placeholder="Cuéntanos qué necesitas: cultivo, volumen, región o tu consulta." className={`${campo} resize-y`} /></div>
    {/* Trampa para bots: las personas no ven este campo. */}
    <div aria-hidden="true" className="absolute -left-[9999px]"><label htmlFor="empresa_web">No completar</label><input id="empresa_web" name="empresa_web" tabIndex={-1} autoComplete="off" /></div>
    <label className="flex items-start gap-3 text-sm leading-relaxed text-gray-600"><input type="checkbox" name="acepto" required className="mt-1 size-4 shrink-0 accent-petroleo" />Acepto que AgroSignal use estos datos solo para responder a mi mensaje.</label>
    {state.error && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-900">{state.error}</p>}
    <button disabled={pending} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-naranja px-7 text-[15px] font-semibold text-petroleo transition hover:bg-[#f29a5e] disabled:opacity-60 sm:w-auto">
      {pending ? 'Enviando…' : <>Enviar mensaje<svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></>}
    </button>
  </form>
}

'use client'

import { useActionState, useRef, useState } from 'react'
import { registerAction } from '@/app/(auth)/actions'
import { buttonClass, Field, FormMessage, inputClass } from './FormFields'

const regions = ['Amazonas', 'Áncash', 'Apurímac', 'Arequipa', 'Ayacucho', 'Cajamarca', 'Callao', 'Cusco', 'Huancavelica', 'Huánuco', 'Ica', 'Junín', 'La Libertad', 'Lambayeque', 'Lima', 'Loreto', 'Madre de Dios', 'Moquegua', 'Pasco', 'Piura', 'Puno', 'San Martín', 'Tacna', 'Tumbes', 'Ucayali']

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, {})
  const [step, setStep] = useState(0)
  const [role, setRole] = useState<'productor' | 'comprador'>('productor')
  const [values, setValues] = useState({ region: '', cultivo_principal: '', tipo_comprador: 'natural', nombre_completo: '', telefono: '', email: '', password: '', password_confirm: '' })
  const [exportacion, setExportacion] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  function field(name: keyof typeof values) {
    return { value: values[name], onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setValues(previous => ({ ...previous, [name]: event.target.value })) }
  }
  function nextStep() {
    const fields = formRef.current?.querySelectorAll<HTMLInputElement | HTMLSelectElement>(`[data-step="${step}"] input, [data-step="${step}"] select`)
    if (fields && Array.from(fields).some(field => !field.reportValidity())) return
    setStep(step + 1)
  }
  return <form ref={formRef} action={action} className="space-y-6" onKeyDown={event => {
    if (event.key === 'Enter' && step < 2 && event.target instanceof HTMLInputElement) { event.preventDefault(); nextStep() }
  }}>
    <div>
      <p className="mb-2 text-sm font-semibold text-petroleo" aria-live="polite">Paso {step + 1} de 3 · {['Tu actividad', 'Tus datos', 'Tu acceso'][step]}</p>
      <div className="flex gap-2" aria-hidden="true">{[0, 1, 2].map(index => <span key={index} className={`h-1.5 flex-1 rounded-full ${index <= step ? 'bg-petroleo' : 'bg-gray-200'}`} />)}</div>
    </div>
    <FormMessage state={state} />
    <fieldset hidden={step !== 0} data-step="0" className="space-y-5">
      <legend className="mb-3 font-semibold">¿Cómo usarás AgroSignal?</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {(['productor', 'comprador'] as const).map(value => <label key={value} className={`cursor-pointer rounded-xl border-2 p-4 ${role === value ? 'border-petroleo bg-crema' : 'border-gray-200'}`}>
          <span className="flex items-center gap-2 font-bold"><input type="radio" name="rol" value={value} checked={role === value} onChange={() => setRole(value)} className="accent-petroleo" />{value === 'productor' ? 'Soy productor' : 'Soy comprador'}</span>
          <span className="mt-2 block text-sm text-gray-600">{value === 'productor' ? 'Quiero publicar y vender mis cosechas.' : 'Quiero encontrar y comprar cosechas.'}</span>
        </label>)}
      </div>
      {role === 'productor' ? <>
        <div className="space-y-2"><label htmlFor="region" className="block text-sm font-semibold">Región donde produces</label><select id="region" name="region" required {...field('region')} className={inputClass}><option value="" disabled>Selecciona tu región</option>{regions.map(region => <option key={region}>{region}</option>)}</select></div>
        <Field label="Cultivo principal" name="cultivo_principal" placeholder="Por ejemplo, palta Hass" required minLength={2} maxLength={100} {...field('cultivo_principal')} />
      </> : <>
        <div className="space-y-2"><label htmlFor="tipo_comprador" className="block text-sm font-semibold">Tipo de comprador</label><select id="tipo_comprador" name="tipo_comprador" required {...field('tipo_comprador')} className={inputClass}><option value="natural">Persona natural</option><option value="empresa">Empresa</option><option value="exportador">Exportador</option></select></div>
        <label className="flex items-start gap-3 text-sm"><input type="checkbox" name="destino_exportacion" checked={exportacion} onChange={event => setExportacion(event.target.checked)} className="mt-1 size-4 accent-petroleo" /><span>Busco productos para exportación</span></label>
      </>}
    </fieldset>
    <fieldset hidden={step !== 1} data-step="1" className="space-y-5">
      <legend className="mb-3 font-semibold">Queremos conocerte</legend>
      <Field label="Nombre completo" name="nombre_completo" autoComplete="name" required minLength={2} maxLength={120} {...field('nombre_completo')} />
      <Field label="Teléfono" name="telefono" type="tel" autoComplete="tel" required minLength={7} maxLength={30} {...field('telefono')} hint="Incluye el código de país si tu número no es peruano." />
    </fieldset>
    <fieldset hidden={step !== 2} data-step="2" className="space-y-5">
      <legend className="mb-3 font-semibold">Protege tu cuenta</legend>
      <Field label="Correo electrónico" name="email" type="email" autoComplete="email" required maxLength={254} {...field('email')} />
      <Field label="Contraseña" name="password" type="password" autoComplete="new-password" required minLength={10} maxLength={128} {...field('password')} hint="Al menos 10 caracteres, una letra y un número." />
      <Field label="Repite tu contraseña" name="password_confirm" type="password" autoComplete="new-password" required minLength={10} maxLength={128} {...field('password_confirm')} />
      <p className="text-xs leading-relaxed text-gray-600">Te enviaremos un enlace para verificar tu correo antes de publicar o comprar.</p>
    </fieldset>
    <div className="flex gap-3">
      {step > 0 && <button type="button" onClick={() => setStep(step - 1)} disabled={pending} className="min-h-11 rounded-full border border-gray-300 px-5 py-3 text-sm font-semibold">Atrás</button>}
      {step < 2 ? <button type="button" onClick={nextStep} className={`${buttonClass} flex-1`}>Continuar</button> : <button className={`${buttonClass} flex-1`} disabled={pending}>{pending ? 'Creando cuenta…' : 'Crear mi cuenta'}</button>}
    </div>
  </form>
}

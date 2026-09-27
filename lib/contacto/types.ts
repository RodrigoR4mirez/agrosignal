// Formulario "Contáctanos": datos de la empresa y opciones del formulario.
export const CONTACTO = {
  correo: 'agrosignal@gmail.com',
  ciudad: 'Lima, Perú',
  horario: 'Lunes a viernes, de 9:00 a 18:00',
  respuesta: 'Respondemos en menos de 24 horas hábiles.',
  consultora: '3RConsulting',
}
export const PERFILES_CONTACTO = { productor: 'Soy productor', comprador: 'Soy comprador', empresa: 'Empresa o institución', otro: 'Otro' } as const
export const ASUNTOS_CONTACTO = { vender: 'Quiero vender mi cosecha', comprar: 'Quiero comprar', verificacion: 'Verificación AgroSignal', cuenta: 'Ayuda con mi cuenta', alianzas: 'Alianzas y prensa', otro: 'Otro tema' } as const
export type MensajeContacto = {
  id: string; nombre: string; correo: string; telefono: string | null
  perfil: keyof typeof PERFILES_CONTACTO; asunto: keyof typeof ASUNTOS_CONTACTO
  mensaje: string; atendido: boolean; creado_en: string
}
export type ContactoState = { error?: string; success?: string; campos?: Record<string, string> }

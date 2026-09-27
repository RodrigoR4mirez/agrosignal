'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { uuidPattern } from '@/lib/marketplace/types'
import { ASUNTOS_CONTACTO, CONTACTO, PERFILES_CONTACTO, type ContactoState } from '@/lib/contacto/types'
import type { ActionState } from '@/lib/supabase/types'

const texto = (form: FormData, clave: string) => String(form.get(clave) ?? '').trim()

// Aviso por correo a través de FormSubmit (sin cuenta ni clave; la primera vez envía un correo de
// activación a la casilla de destino). Si falla, el mensaje igual queda guardado para el admin.
async function avisarPorCorreo(datos: Record<string, string>) {
  const destino = process.env.CONTACTO_CORREO || CONTACTO.correo
  const origen = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://agrosignal.vercel.app').origin
  try {
    const r = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(destino)}`, {
      method: 'POST', signal: AbortSignal.timeout(8000),
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', Origin: origen, Referer: `${origen}/contacto` },
      body: JSON.stringify({ _subject: `AgroSignal · ${datos.Asunto} · ${datos.Nombre}`, _template: 'table', _captcha: 'false', _replyto: datos.Correo, ...datos }),
    })
    return r.ok
  } catch { return false }
}

export async function enviarContactoAction(_: ContactoState, form: FormData): Promise<ContactoState> {
  const campos = Object.fromEntries(['nombre', 'correo', 'telefono', 'perfil', 'asunto', 'mensaje'].map(c => [c, texto(form, c)]))
  if (texto(form, 'empresa_web')) return { success: 'Gracias, recibimos tu mensaje.' } // trampa para bots
  const { nombre, correo, telefono, perfil, asunto, mensaje } = campos
  if (nombre.length < 2 || nombre.length > 120) return { error: 'Escribe tu nombre (de 2 a 120 caracteres).', campos }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo) || correo.length > 160) return { error: 'Revisa tu correo electrónico.', campos }
  if (telefono && !/^[+\d][\d\s-]{5,29}$/.test(telefono)) return { error: 'Revisa tu teléfono: solo números, espacios, guiones y +.', campos }
  if (!(perfil in PERFILES_CONTACTO) || !(asunto in ASUNTOS_CONTACTO)) return { error: 'Elige quién eres y el motivo de tu mensaje.', campos }
  if (mensaje.length < 10 || mensaje.length > 2000) return { error: 'Escribe tu mensaje (de 10 a 2000 caracteres).', campos }
  if (form.get('acepto') !== 'on') return { error: 'Acepta que usemos tus datos para responderte.', campos }

  const db = await createClient()
  const { error } = await db.rpc('enviar_mensaje_contacto', { p_nombre: nombre, p_correo: correo, p_telefono: telefono, p_perfil: perfil, p_asunto: asunto, p_mensaje: mensaje })
  if (error) return { error: error.code === '54000' ? error.message : 'No pudimos enviar tu mensaje. Inténtalo de nuevo en unos minutos.', campos }
  await avisarPorCorreo({ Nombre: nombre, Correo: correo, Teléfono: telefono || '—', Perfil: PERFILES_CONTACTO[perfil as keyof typeof PERFILES_CONTACTO], Asunto: ASUNTOS_CONTACTO[asunto as keyof typeof ASUNTOS_CONTACTO], Mensaje: mensaje })
  revalidatePath('/admin/mensajes')
  return { success: `Gracias, ${nombre.split(' ')[0]}. Recibimos tu mensaje y te responderemos a ${correo}. ${CONTACTO.respuesta}` }
}

export async function marcarMensajeAction(_: ActionState, form: FormData): Promise<ActionState> {
  await requireRole('admin')
  const id = texto(form, 'id'), atendido = texto(form, 'atendido') === '1'
  if (!uuidPattern.test(id)) return { error: 'Mensaje no válido.' }
  const db = await createClient()
  const { error } = await db.from('mensajes_contacto').update({ atendido }).eq('id', id)
  if (error) return { error: 'No pudimos guardar el cambio.' }
  revalidatePath('/admin/mensajes')
  return { success: atendido ? 'Marcado como atendido.' : 'Marcado como pendiente.' }
}

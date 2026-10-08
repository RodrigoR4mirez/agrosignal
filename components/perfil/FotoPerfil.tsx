'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { guardarFotoPerfil } from '@/app/panel-productor/actions'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from './Avatar'
import { buttonSecondaryClass } from '@/components/ui/estilos'
import { cn } from '@/lib/utils'

const TIPOS: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

// Sube la foto al bucket fotos-perfil y luego la guarda en el perfil; si falla, borra lo subido.
export function FotoPerfil({ owner, nombre, foto }: { owner: string; nombre: string; foto: string | null }) {
  const router = useRouter()
  const [estado, setEstado] = useState<{ error?: string; ok?: string; subiendo?: boolean }>({})
  async function elegir(archivo: File | undefined) {
    if (!archivo) return
    if (!TIPOS[archivo.type]) { setEstado({ error: 'Usa una foto JPG, PNG o WebP.' }); return }
    if (archivo.size === 0 || archivo.size > 2 * 1024 * 1024) { setEstado({ error: 'La foto debe pesar hasta 2 MB.' }); return }
    setEstado({ subiendo: true })
    const db = createClient()
    const ruta = `${owner}/${crypto.randomUUID()}.${TIPOS[archivo.type]}`
    const subida = await db.storage.from('fotos-perfil').upload(ruta, archivo, { contentType: archivo.type, upsert: false })
    if (subida.error) { setEstado({ error: 'No pudimos subir la foto. Intenta nuevamente.' }); return }
    const guardado = await guardarFotoPerfil(ruta)
    if (guardado.error) { await db.storage.from('fotos-perfil').remove([ruta]); setEstado({ error: guardado.error }); return }
    setEstado({ ok: 'Foto actualizada.' })
    router.refresh()
  }
  async function quitar() {
    setEstado({ subiendo: true })
    const guardado = await guardarFotoPerfil(null)
    setEstado(guardado.error ? { error: guardado.error } : { ok: 'Quitaste tu foto. Se mostrarán tus iniciales.' })
    router.refresh()
  }
  return <div className="flex flex-wrap items-center gap-5">
    <Avatar nombre={nombre} foto={foto} className="size-20 text-xl" />
    <div className="min-w-0 space-y-2">
      <div className="flex flex-wrap gap-3">
        <label className={cn(buttonSecondaryClass, 'cursor-pointer has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-petroleo', estado.subiendo && 'pointer-events-none opacity-60')}>
          {estado.subiendo ? 'Guardando…' : foto ? 'Cambiar foto' : 'Subir foto'}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={estado.subiendo} onChange={event => { void elegir(event.target.files?.[0]); event.target.value = '' }} />
        </label>
        {foto && <button type="button" onClick={() => void quitar()} disabled={estado.subiendo} className={buttonSecondaryClass}>Quitar</button>}
      </div>
      <p className="text-xs text-gray-500">JPG, PNG o WebP de hasta 2 MB. Una foto tuya o de tu campo genera más confianza.</p>
      <p aria-live="polite" className={`text-sm ${estado.error ? 'text-red-700' : 'text-petroleo'}`}>{estado.error ?? estado.ok ?? ''}</p>
    </div>
  </div>
}

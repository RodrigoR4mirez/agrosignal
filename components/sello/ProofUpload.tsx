'use client'

import { useId, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { inputClass } from '@/components/auth/FormFields'

const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf', 'video/mp4': 'mp4' }
export function ProofUpload({ bucket, owner, lotId, onReady, onBusy, disabled = false }: {
  bucket: 'certificados' | 'evidencia-drones' | 'evidencia-tests'; owner: string; lotId: string
  onReady: (paths: string[]) => void; onBusy: (busy: boolean) => void; disabled?: boolean
}) {
  const id = useId()
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const maximum = bucket === 'evidencia-drones' ? 6 : 1
  const megabytes = bucket === 'evidencia-drones' ? 50 : bucket === 'certificados' ? 10 : 5
  const allowed = ['image/jpeg', 'image/png', 'image/webp', ...(bucket === 'certificados' ? ['application/pdf'] : bucket === 'evidencia-drones' ? ['video/mp4'] : [])]
  async function upload(files: FileList | null) {
    if (!files?.length) return
    onReady([]); setError(''); setStatus('')
    const selected = Array.from(files)
    if (selected.length > maximum) { setError(`Selecciona hasta ${maximum} ${maximum === 1 ? 'archivo' : 'archivos'}.`); return }
    if (selected.some(file => !allowed.includes(file.type) || file.size === 0 || file.size > megabytes * 1024 * 1024)) {
      setError(`Revisa el formato y el tamaño de tus archivos. El máximo es ${megabytes} MB por archivo.`); return
    }
    setUploading(true); onBusy(true)
    try {
      const db = createClient()
      const paths: string[] = []
      for (const [index, file] of selected.entries()) {
        setStatus(`Subiendo archivo ${index + 1} de ${selected.length}…`)
        const path = `${owner}/${lotId}/${crypto.randomUUID()}.${extensions[file.type]}`
        const result = await db.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type })
        if (result.error) throw new Error('upload')
        paths.push(path)
      }
      onReady(paths)
      setStatus(`${paths.length} ${paths.length === 1 ? 'archivo listo' : 'archivos listos'}. Guarda el formulario para registrar la evidencia.`)
    } catch { setError('No pudimos subir la evidencia. Revisa tu conexión y vuelve a seleccionar los archivos.'); setStatus('') }
    finally { setUploading(false); onBusy(false) }
  }
  return <div className="space-y-2">
    <label htmlFor={id} className="block text-sm font-semibold">{bucket === 'certificados' ? 'Certificado (PDF o imagen)' : bucket === 'evidencia-drones' ? 'Fotos o video de la inspección' : 'Foto del resultado'}</label>
    <input id={id} type="file" accept={allowed.join(',')} multiple={maximum > 1} disabled={disabled || uploading} onChange={event => { const input = event.currentTarget; void upload(input.files).finally(() => { input.value = '' }) }} className={`${inputClass} text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-crema file:px-3 file:py-2 file:text-petroleo`} />
    <p className="text-xs leading-relaxed text-gray-600">Hasta {maximum} {maximum === 1 ? 'archivo' : 'archivos'}, {megabytes} MB por archivo. JPG, PNG, WebP{bucket === 'certificados' ? ' o PDF' : bucket === 'evidencia-drones' ? ' o MP4' : ''}. Acceso privado para el productor y la administración.</p>
    {status && <p role="status" className="text-sm text-petroleo">{status}</p>}
    {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
  </div>
}

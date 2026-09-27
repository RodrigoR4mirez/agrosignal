import Image from 'next/image'
import { fotoPerfilUrl } from '@/lib/marketplace/types'

// Foto de perfil del productor; sin foto, sus iniciales sobre crema.
export function Avatar({ nombre, foto, className = 'size-9 text-xs' }: { nombre: string; foto?: string | null; className?: string }) {
  const url = fotoPerfilUrl(foto)
  const iniciales = nombre.split(/\s+/).filter(Boolean).slice(0, 2).map(parte => parte[0]).join('').toUpperCase()
  return <span aria-hidden="true" className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-crema font-bold text-petroleo ring-2 ring-white ${className}`}>
    {url ? <Image src={url} alt="" fill unoptimized sizes="96px" className="object-cover" /> : iniciales}
  </span>
}

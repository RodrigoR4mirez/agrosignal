import Image from 'next/image'
import Link from 'next/link'
import { SelloInocuidadBadge } from '@/components/SelloInocuidadBadge'
import { ReputacionCompacta } from '@/components/calificaciones/Reputacion'
import { COSECHA, esEjemplo, money, photoUrl, quantity, type LotePublico } from '@/lib/marketplace/types'

const PUNTO_COSECHA = { disponible: 'bg-musgo', en_cosecha: 'bg-naranja', proxima: 'bg-trigo' }

// Tarjeta del catálogo: foto primero; luego origen, cultivo, precio y disponibilidad;
// al pie, quién vende y su reputación. Toda la tarjeta es un enlace.
export function LotCard({ lot, eager = false }: { lot: LotePublico; eager?: boolean }) {
  const photo = photoUrl(lot.fotos[0] ?? '')
  const iniciales = lot.productor_nombre.split(/\s+/).filter(Boolean).slice(0, 2).map(parte => parte[0]).join('').toUpperCase()
  return <article className="group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-[#ebe4d4] bg-white shadow-[0_1px_2px_rgba(19,53,53,0.05)] transition-[box-shadow,translate] duration-300 hover:-translate-y-1 hover:shadow-[0_24px_44px_-24px_rgba(19,53,53,0.45)] has-focus-visible:outline-2 has-focus-visible:outline-offset-4 has-focus-visible:outline-petroleo motion-reduce:transition-none motion-reduce:hover:translate-y-0">
    <div className="relative aspect-4/3 overflow-hidden bg-crema">
      {photo ? <Image src={photo} alt={`Lote de ${lot.cultivo} en ${lot.region}`} fill unoptimized loading={eager ? 'eager' : 'lazy'} sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
        : <div className="flex h-full items-center justify-center text-sm text-petroleo/70">Foto no disponible</div>}
      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-black/40 to-transparent" />
      <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-petroleo shadow-sm"><span aria-hidden="true" className={`size-2 rounded-full ${PUNTO_COSECHA[lot.estado_cosecha]}`} />{COSECHA[lot.estado_cosecha]}</span>
      {esEjemplo(lot) && <span title="Lote de demostración: no está disponible para compra" className="absolute right-3 top-3 rounded-full bg-trigo px-3 py-1 text-xs font-bold text-petroleo">Ejemplo</span>}
      <span className="absolute bottom-3 left-4 text-xs font-semibold text-white">{lot.destino === 'local' ? 'Mercado local' : 'Exportación'}</span>
    </div>
    <div className="flex flex-1 flex-col p-5">
      <p className="flex items-center gap-1 text-xs font-semibold text-tierra wrap-anywhere">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
        {lot.provincia}, {lot.region}
      </p>
      <h2 className="mt-1.5 text-[22px] font-medium leading-tight text-petroleo wrap-anywhere">
        <Link href={`/marketplace/${lot.id}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">{lot.cultivo}</Link>
      </h2>
      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-[26px] font-bold leading-none tabular-nums text-petroleo wrap-anywhere">{money(lot.precio_unidad)}<span className="ml-1 text-sm font-normal text-gray-500">/ {lot.unidad}</span></p>
        <p className="shrink-0 text-right text-xs leading-snug text-gray-500"><span className="block text-sm font-semibold tabular-nums text-gray-800">{quantity(lot.cantidad_disponible)} {lot.unidad}</span>disponibles</p>
      </div>
      <div className="mt-4"><SelloInocuidadBadge nivel={lot.nivel_sello} /></div>
      <div className="min-h-5 flex-1" />
      <div className="flex items-center gap-3 border-t border-[#f0ebdf] pt-4">
        <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-crema text-xs font-bold text-petroleo ring-1 ring-[#ebe4d4]">{iniciales}</span>
        <div className="min-w-0"><p className="truncate text-sm text-gray-800">{lot.productor_nombre}</p><ReputacionCompacta promedio={lot.productor_promedio} total={lot.productor_calificaciones} /></div>
      </div>
    </div>
  </article>
}

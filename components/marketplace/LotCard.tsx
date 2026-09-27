import Image from 'next/image'
import Link from 'next/link'
import { Estrellas } from '@/components/calificaciones/Reputacion'
import { promedioTexto } from '@/lib/calificaciones/types'
import { Avatar } from '@/components/perfil/Avatar'
import { COSECHA, descuento, esEjemplo, money, photoUrl, quantity, type LotePublico } from '@/lib/marketplace/types'

const PUNTO_COSECHA = { disponible: 'bg-musgo', en_cosecha: 'bg-naranja', proxima: 'bg-trigo' }
const NIVEL = ['Sin verificar', 'Nivel 1', 'Nivel 2', 'Nivel 3']

// Tarjeta del catálogo: foto sobre fondo crema con insignias (descuento, estado) y una franja
// de vidrio con el productor y su verificación; debajo, nombre, estrellas y precio. Toda es enlace.
export function LotCard({ lot, eager = false }: { lot: LotePublico; eager?: boolean }) {
  const photo = photoUrl(lot.fotos[0] ?? '')
  const rebaja = descuento(lot)
  const conPromedio = lot.productor_promedio !== null
  return <article className="group relative flex h-full flex-col rounded-[24px] border border-[#ebe4d4] bg-white p-2.5 transition-[box-shadow,translate] duration-300 hover:-translate-y-1 hover:shadow-[0_24px_44px_-26px_rgba(19,53,53,0.45)] has-focus-visible:outline-2 has-focus-visible:outline-offset-4 has-focus-visible:outline-petroleo motion-reduce:transition-none motion-reduce:hover:translate-y-0">
    <div className="relative aspect-square overflow-hidden rounded-[18px] bg-crema">
      {photo ? <Image src={photo} alt={`Lote de ${lot.cultivo} en ${lot.region}`} fill unoptimized loading={eager ? 'eager' : 'lazy'} sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw" className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
        : <div className="flex h-full items-center justify-center text-sm text-petroleo/70">Foto no disponible</div>}
      <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
        {rebaja && <span className="rounded-full bg-naranja px-2.5 py-1 text-xs font-bold tabular-nums text-petroleo shadow-sm">−{rebaja}%</span>}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/75 px-2.5 py-1 text-[11px] font-semibold text-petroleo ring-1 ring-white/70 backdrop-blur-md"><span aria-hidden="true" className={`size-1.5 rounded-full ${PUNTO_COSECHA[lot.estado_cosecha]}`} />{COSECHA[lot.estado_cosecha]}</span>
      </div>
      {esEjemplo(lot) && <span title="Lote de demostración: no está disponible para compra" className="absolute right-2.5 top-2.5 rounded-full bg-trigo px-2.5 py-1 text-[11px] font-bold text-petroleo">Ejemplo</span>}
      {/* Franja de vidrio: quién lo produce y su nivel de verificación */}
      <div className="absolute inset-x-2.5 bottom-2.5 flex items-center gap-2.5 rounded-2xl bg-white/60 p-2 pr-3 ring-1 ring-white/70 backdrop-blur-xl backdrop-saturate-150">
        <Avatar nombre={lot.productor_nombre} foto={lot.productor_foto} className="size-8 text-[11px]" />
        <p className="min-w-0 flex-1 truncate text-xs font-semibold text-petroleo">{lot.productor_nombre}</p>
        <span title={`Verificación AgroSignal: ${NIVEL[lot.nivel_sello] ?? NIVEL[0]}`} className="flex shrink-0 items-end gap-0.5" aria-label={`Verificación AgroSignal: ${NIVEL[lot.nivel_sello] ?? NIVEL[0]}`}>
          {[1, 2, 3].map(barra => <span key={barra} className={`w-1 rounded-full ${barra <= lot.nivel_sello ? 'bg-musgo' : 'bg-petroleo/20'}`} style={{ height: 5 + barra * 2 }} />)}
        </span>
      </div>
    </div>

    <div className="flex flex-1 flex-col px-2 pb-2 pt-4">
      <p className="truncate text-xs text-tierra">{lot.provincia}, {lot.region} · {lot.destino === 'local' ? 'Mercado local' : 'Exportación'}</p>
      <h2 className="mt-1 text-[17px] font-semibold leading-snug text-petroleo wrap-anywhere">
        <Link href={`/marketplace/${lot.id}`} className="after:absolute after:inset-0 after:rounded-[24px] after:content-[''] focus-visible:outline-none">{lot.cultivo}</Link>
      </h2>
      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500">
        {conPromedio ? <Estrellas valor={lot.productor_promedio!} tamano={13} /> : <span aria-hidden="true"><Estrellas valor={0} tamano={13} /></span>}
        {conPromedio ? <><span className="font-bold tabular-nums text-cacao">{promedioTexto(Number(lot.productor_promedio))}</span><span className="tabular-nums">({lot.productor_calificaciones})</span></> : <span>Productor nuevo</span>}
      </p>
      <div className="min-h-3 flex-1" />
      <div className="flex items-end justify-between gap-2">
        <p className="flex flex-wrap items-baseline gap-x-2 wrap-anywhere">
          <span className="text-xl font-bold tabular-nums text-petroleo">{money(lot.precio_unidad)}</span>
          {rebaja && <span className="text-sm tabular-nums text-gray-400 line-through">{money(Number(lot.precio_anterior))}</span>}
          <span className="text-xs text-gray-500">/ {lot.unidad}</span>
        </p>
        <p className="shrink-0 text-right text-[11px] leading-tight text-gray-500"><span className="block text-xs font-semibold tabular-nums text-gray-800">{quantity(lot.cantidad_disponible)} {lot.unidad}</span>disponibles</p>
      </div>
    </div>
  </article>
}

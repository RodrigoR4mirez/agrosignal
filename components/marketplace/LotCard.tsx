import Image from 'next/image'
import Link from 'next/link'
import { SelloInocuidadBadge } from '@/components/SelloInocuidadBadge'
import { Card } from '@/components/ui/Card'
import { COSECHA, money, photoUrl, quantity, type LotePublico } from '@/lib/marketplace/types'

export function LotCard({ lot, eager = false }: { lot: LotePublico; eager?: boolean }) {
  const photo = photoUrl(lot.fotos[0] ?? '')
  return <Card className="card-surface-hover overflow-hidden rounded-[22px] border-[#e4e0d2] p-0">
    <Link href={`/marketplace/${lot.id}`} className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bosque">
      <div className="relative aspect-4/3 bg-arena-claro">
        {photo ? <Image src={photo} alt={`Lote de ${lot.cultivo} en ${lot.region}`} fill unoptimized loading={eager ? 'eager' : 'lazy'} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-green-900">Foto no disponible</div>}
        <span className="absolute left-3 top-3 rounded-full bg-bosque/90 px-3 py-1 text-xs font-semibold text-arena-claro backdrop-blur">{COSECHA[lot.estado_cosecha]}</span>
      </div>
      <div className="space-y-3 p-5">
        <p className="wrap-anywhere text-xs font-semibold text-tierra">{lot.provincia}, {lot.region}</p>
        <h2 className="wrap-anywhere text-2xl font-medium text-bosque">{lot.cultivo}</h2>
        <p className="text-sm text-gray-600">{quantity(lot.cantidad_disponible)} {lot.unidad} disponibles · {lot.destino === 'local' ? 'Mercado local' : 'Exportación'}</p>
        <p className="wrap-anywhere text-2xl font-extrabold tabular-nums text-cacao">{money(lot.precio_unidad)} <span className="text-sm font-normal text-gray-500">/ {lot.unidad}</span></p>
        <SelloInocuidadBadge nivel={lot.nivel_sello} />
        <p className="truncate text-xs text-gray-500">Publicado por {lot.productor_nombre}</p>
      </div>
    </Link>
  </Card>
}

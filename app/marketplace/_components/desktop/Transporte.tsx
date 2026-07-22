import Link from 'next/link'
import { MaterialSymbol } from '../shared/MaterialSymbol'
import { ProBadge } from '../shared/ProBadge'

export function Transporte() {
  return (
    <section className="ms-container relative px-6 py-24">
      <div className="flex flex-col gap-12 lg:flex-row">
        <div className="lg:w-1/3">
          <h2 className="mb-6 text-4xl font-extrabold text-[var(--ms-primary)]">Transporte Inteligente</h2>
          <p className="mb-8 text-[var(--ms-on-surface-variant)]">
            Cotiza fletes de inmediato y rastrea tu mercadería en tiempo real desde que sale del campo hasta su
            destino.
          </p>
          <div className="space-y-4">
            <div className="rounded-[1rem] border border-[var(--ms-outline-variant)] bg-white p-4">
              <label className="mb-2 block text-xs font-bold text-[var(--ms-outline)] uppercase">
                Origen / Destino
              </label>
              <div className="flex items-center gap-2">
                <MaterialSymbol name="my_location" className="text-[var(--ms-primary)]" />
                <span className="font-medium text-[var(--ms-on-surface)]">Huancayo</span>
                <MaterialSymbol name="arrow_forward" className="text-[var(--ms-outline)]" />
                <span className="font-medium text-[var(--ms-on-surface)]">Lima (Merca)</span>
              </div>
            </div>
            <div className="rounded-[1rem] border border-[var(--ms-outline-variant)] bg-white p-4">
              <label className="mb-2 block text-xs font-bold text-[var(--ms-outline)] uppercase">Tipo de Carga</label>
              <div className="flex items-center gap-2">
                <MaterialSymbol name="inventory_2" className="text-[var(--ms-primary)]" />
                <span className="font-medium text-[var(--ms-on-surface)]">Papa Yungay - 20 Ton</span>
              </div>
            </div>
          </div>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:w-2/3">
          <div className="relative flex flex-col justify-between overflow-hidden rounded-[1.5rem] bg-[var(--ms-primary)] p-8 text-white">
            <div className="relative z-10">
              <div className="mb-6 flex items-center justify-between">
                <span className="rounded-full bg-[var(--ms-secondary)] px-3 py-1 text-xs font-black text-[var(--ms-primary)]">
                  CARGA COMPARTIDA
                </span>
                <span className="text-xs">ID: #TRX-9921</span>
              </div>
              <h4 className="mb-4 text-2xl font-bold">Ahorra hasta S/ 1,200</h4>
              <p className="mb-6 text-sm opacity-80">
                Hay un camión disponible regresando de Jauja. Solo queda el 30% de espacio.
              </p>
              <div className="mb-6 rounded-[1rem] bg-white/10 p-4">
                <div className="mb-2 flex justify-between text-xs">
                  <span>Ocupación actual</span>
                  <span className="font-bold">70%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-white/20">
                  <div className="h-full w-[70%] bg-[var(--ms-secondary-container)]" />
                </div>
              </div>
            </div>
            <Link
              href="/pro"
              className="relative z-10 block w-full rounded-[1rem] bg-white py-3 text-center font-bold text-[var(--ms-primary)] transition-colors hover:bg-[var(--ms-secondary-container)]"
            >
              <span className="flex items-center justify-center gap-2">
                <ProBadge /> Solicitar espacio
              </span>
            </Link>
          </div>
          <div className="group overflow-hidden rounded-[1.5rem] border border-[var(--ms-outline-variant)] bg-white p-2 shadow-xl">
            <img
              src="/marketplace/transporte-camion.jpg"
              alt="Camión de logística en carretera costera al atardecer"
              className="mb-4 h-48 w-full rounded-[1rem] object-cover"
            />
            <div className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ms-surface-container)]">
                    <MaterialSymbol name="person" className="text-[var(--ms-primary)]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Jorge Mendoza</p>
                    <p className="text-xs text-[var(--ms-outline)]">Conductor Verificado</p>
                  </div>
                </div>
                <div className="flex items-center text-[var(--ms-secondary)]">
                  <MaterialSymbol name="star" className="!text-sm" />
                  <span className="text-xs font-bold">4.9</span>
                </div>
              </div>
              <div className="relative h-32 overflow-hidden rounded-[1rem] border border-[var(--ms-outline-variant)]/30 bg-[var(--ms-surface-container)]">
                <img
                  src="/marketplace/transporte-gps-mapa.jpg"
                  alt="Mapa de rastreo GPS en tiempo real"
                  className="h-full w-full object-cover"
                />
                <div className="absolute right-2 bottom-2 rounded bg-white px-2 py-1 text-[10px] font-bold shadow-sm">
                  GPS: EN VIVO
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

import { MaterialSymbol } from '../shared/MaterialSymbol'
import { PlaceholderImage } from '../shared/PlaceholderImage'
import { ProBadge } from '../shared/ProBadge'

export function Exportacion() {
  return (
    <section className="relative overflow-hidden bg-[var(--ms-primary)] py-24 text-white">
      <div className="ms-container relative z-10 px-6">
        <div className="mb-16 flex flex-col items-end justify-between gap-6 lg:flex-row">
          <div className="max-w-xl">
            <h2 className="mb-4 text-4xl font-extrabold">Oportunidades de Exportación</h2>
            <p className="opacity-70">
              Identificamos los mercados con mayor demanda y mejores precios para tus productos.
            </p>
          </div>
          <select className="rounded-[0.5rem] border border-white/20 bg-white/10 px-4 py-2 text-white">
            <option>Arándano</option>
            <option>Palta Hass</option>
            <option>Mango Kent</option>
          </select>
        </div>
        <div className="grid items-start gap-8 lg:grid-cols-12">
          <div className="group relative overflow-hidden rounded-[1.5rem] border border-white/10 shadow-2xl lg:col-span-8">
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-[var(--ms-primary)]/40 to-transparent pointer-events-none" />
            <PlaceholderImage icon="public" tone="gold" className="h-full min-h-[420px] w-full" />
            <div className="absolute bottom-6 left-6 z-20 flex gap-2">
              <span className="rounded-full bg-[var(--ms-secondary)] px-3 py-1 text-[10px] font-black tracking-widest text-[var(--ms-primary)] uppercase">
                Visualización en Tiempo Real
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                Fuente: Aduanas 2023
              </span>
            </div>
          </div>
          <div className="space-y-6 lg:col-span-4">
            <div className="rounded-[1.5rem] border border-white/20 bg-white/10 p-8 shadow-xl backdrop-blur-md">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white">Mercado Seleccionado</h3>
                <MaterialSymbol name="public" className="text-[var(--ms-gold-accent)]" />
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-8 w-12 items-center justify-center overflow-hidden rounded border border-white/10 bg-white/10">
                    <span className="text-xl">🇺🇸</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white">Estados Unidos</h4>
                    <p className="text-xs tracking-widest text-white/60 uppercase">Principal Socio Comercial</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-[1rem] border border-white/5 bg-white/5 p-3">
                    <p className="mb-1 text-[10px] text-white/50 uppercase">TLC</p>
                    <span className="text-xs font-black text-[var(--ms-gold-accent)]">ACTIVO</span>
                  </div>
                  <div className="rounded-[1rem] border border-white/5 bg-white/5 p-3">
                    <p className="mb-1 text-[10px] text-white/50 uppercase">Certificación</p>
                    <span className="text-[10px] font-black text-green-400">AGROSIGNAL</span>
                  </div>
                </div>
                <div className="space-y-4 border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">Precio Promedio</span>
                    <span className="text-lg font-bold text-[var(--ms-gold-accent)]">$4.50 / kg</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">Demanda</span>
                    <span className="flex items-center gap-1 font-bold text-green-400">
                      <MaterialSymbol name="trending_up" className="!text-sm" /> +12%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">Arancel</span>
                    <span className="font-bold text-white">0% (Preferencial)</span>
                  </div>
                </div>
                <button className="w-full rounded-[1rem] bg-[var(--ms-secondary-container)] py-4 font-bold text-[var(--ms-primary)] shadow-lg transition-all hover:bg-white">
                  <span className="flex items-center justify-center gap-2">
                    <ProBadge /> Ver Reporte Detallado
                  </span>
                </button>
              </div>
            </div>
            <div className="group relative">
              <MaterialSymbol
                name="search"
                className="absolute top-1/2 left-4 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-[var(--ms-secondary-container)]"
              />
              <MaterialSymbol name="lock" className="absolute top-1/2 right-4 !text-sm -translate-y-1/2 text-[var(--ms-gold-accent)]" />
              <input
                className="w-full rounded-[1.5rem] border border-white/10 bg-white/5 py-4 pr-4 pl-12 text-white placeholder:text-white/30 focus:border-transparent focus:ring-2 focus:ring-[var(--ms-secondary-container)]"
                placeholder="Buscar otro país..."
                type="text"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

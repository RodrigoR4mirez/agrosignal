import { MaterialSymbol } from '../shared/MaterialSymbol'
import { ProBadge } from '../shared/ProBadge'

export function AsesoriaComunidad() {
  return (
    <section className="ms-container relative grid gap-16 px-6 py-24 lg:grid-cols-2">
      <div>
        <h2 className="mb-8 text-3xl font-extrabold text-[var(--ms-primary)]">Asesoría Profesional</h2>
        <div className="group relative">
          <div className="rounded-[1.5rem] border border-[var(--ms-outline-variant)] bg-white p-8 shadow-lg">
            <div className="mb-8 flex items-center gap-6">
              <img
                src="/marketplace/asesor-ricardo.jpg"
                alt="Ing. Ricardo Salas, especialista en frutales de exportación"
                className="h-24 w-24 rounded-[1rem] object-cover"
              />
              <div>
                <h4 className="text-xl font-bold">Ing. Ricardo Salas</h4>
                <p className="font-medium text-[var(--ms-primary)]">Especialista en Frutales de Exportación</p>
                <div className="mt-1 flex text-[var(--ms-secondary-container)]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <MaterialSymbol key={i} name="star" filled className="!text-sm" />
                  ))}
                </div>
              </div>
            </div>
            <p className="mb-6 text-[var(--ms-on-surface-variant)]">
              &quot;He ayudado a más de 50 productores de palta en Moquegua a mejorar su calibre en un 20% mediante
              fertirriego controlado.&quot;
            </p>
            <button className="w-full rounded-[1rem] bg-[var(--ms-surface-container)] py-3 font-bold text-[var(--ms-primary)] transition-all hover:bg-[var(--ms-primary)] hover:text-white">
              Agendar Video-Asesoría
            </button>
          </div>
          <div className="mt-6 flex justify-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[var(--ms-primary)]" />
            <div className="h-2 w-2 rounded-full bg-[var(--ms-outline-variant)]" />
            <div className="h-2 w-2 rounded-full bg-[var(--ms-outline-variant)]" />
          </div>
        </div>
      </div>
      <div>
        <h2 className="mb-8 text-3xl font-extrabold text-[var(--ms-primary)]">Voz del Campo</h2>
        <div className="space-y-4">
          <div className="cursor-pointer rounded-[1rem] border border-[var(--ms-outline-variant)] bg-white p-6 transition-colors hover:border-[var(--ms-primary)]/30">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ms-secondary-container)]/20 font-bold text-[var(--ms-secondary)]">
                ML
              </div>
              <div>
                <p className="text-sm font-bold">
                  Marcos López <span className="text-xs font-normal text-[var(--ms-outline)]">hace 2 horas</span>
                </p>
                <p className="text-xs font-bold text-[var(--ms-primary)]">Arequipa • Cebolla</p>
              </div>
            </div>
            <p className="mb-4 text-sm">
              &quot;Alerta: Reportan presencia de mildiu en la zona baja de Majes. ¿Alguien ha probado el
              tratamiento sistémico que recomendó AgroSignal?&quot;
            </p>
            <div className="flex gap-6 text-[var(--ms-outline)]">
              <span className="flex items-center gap-1 text-xs">
                <MaterialSymbol name="mode_comment" className="!text-sm" /> 12 comentarios
              </span>
              <span className="flex items-center gap-1 text-xs">
                <MaterialSymbol name="thumb_up" className="!text-sm" /> 45 útiles
              </span>
            </div>
          </div>
          <div className="cursor-pointer rounded-[1rem] border border-[var(--ms-outline-variant)] bg-white p-6 opacity-80 transition-colors hover:border-[var(--ms-primary)]/30">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ms-primary)]/10 font-bold text-[var(--ms-primary)]">
                EV
              </div>
              <div>
                <p className="text-sm font-bold">
                  Elena Valdivia <span className="text-xs font-normal text-[var(--ms-outline)]">hace 5 horas</span>
                </p>
                <p className="text-xs font-bold text-[var(--ms-primary)]">Chanchamayo • Café</p>
              </div>
            </div>
            <p className="text-sm">
              &quot;¡Logré mi primera exportación a Alemania gracias a la plataforma! El proceso de documentación fue
              mucho más simple de lo esperado.&quot;
            </p>
          </div>
          <button className="w-full rounded-[1.5rem] border-2 border-dashed border-[var(--ms-outline-variant)] py-4 text-sm font-bold text-[var(--ms-primary)] hover:border-[var(--ms-primary)] hover:bg-[var(--ms-primary)]/5">
            <span className="flex items-center justify-center gap-2">
              <ProBadge /> Explorar Comunidad
            </span>
          </button>
        </div>
      </div>
    </section>
  )
}

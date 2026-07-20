import { MaterialSymbol } from '../shared/MaterialSymbol'

export function SelloInocuidad() {
  return (
    <section className="ms-container relative flex flex-col items-center gap-16 px-6 py-24 md:flex-row">
      <div className="md:w-1/2">
        <img
          src="/marketplace/sello-inocuidad-palta.jpg"
          alt="Palta Hass con sello de verificación de inocuidad"
          className="h-[500px] w-full rounded-[1.5rem] border-4 border-white object-cover shadow-2xl"
        />
      </div>
      <div className="space-y-6 md:w-1/2">
        <h2 className="text-4xl font-extrabold text-[var(--ms-primary)]">Sello de Inocuidad AgroSignal</h2>
        <p className="text-xl text-[var(--ms-on-surface-variant)]">
          Cada lote publicado en nuestra plataforma cuenta con una trazabilidad completa. Validamos límites máximos
          de residuos (LMR) y certificaciones internacionales.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="mb-4 flex items-start justify-between">
              <h4 className="text-lg font-bold">China</h4>
              <div className="flex flex-col items-end">
                <span className="text-xs font-black opacity-50">PROTOCOLO FITO</span>
                <span className="text-[10px] font-bold text-[var(--ms-secondary-container)]">ARANCEL 5%</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="opacity-70">Precio Promedio</span>
                <span className="font-bold">$6.20 / kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="opacity-70">Demanda Actual</span>
                <span className="flex items-center font-bold text-[var(--ms-secondary)]">MODERADA</span>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <MaterialSymbol name="verified" className="!text-xs text-[var(--ms-primary)]" />
                <span className="rounded-full bg-[var(--ms-secondary)] px-2 py-0.5 text-[8px] text-white">
                  RIESGO MEDIO
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6 rounded-[1rem] border border-[var(--ms-secondary-container)] bg-[var(--ms-secondary-container)]/20 p-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-[var(--ms-secondary-container)] bg-white shadow-lg">
            <MaterialSymbol name="health_and_safety" filled className="!text-3xl text-[var(--ms-secondary)]" />
          </div>
          <div>
            <h4 className="font-bold text-[var(--ms-primary)]">Libre de Residuos</h4>
            <p className="text-sm text-[var(--ms-on-surface-variant)]">
              Garantizamos que el producto cumple con los estándares más estrictos de Europa y USA.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

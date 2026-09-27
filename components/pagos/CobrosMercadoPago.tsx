import { DesconectarMercadoPago } from './DesconectarMercadoPago'

const AVISOS: Record<string, [string, string]> = {
  conectado: ['bg-musgo/10 text-bosque', 'Tu cuenta de Mercado Pago quedó conectada.'],
  error: ['bg-red-50 text-red-900', 'No pudimos conectar tu cuenta. Intenta nuevamente.'],
  'no-disponible': ['bg-amber-50 text-amber-950', 'El cobro en línea no está disponible por ahora.'],
}

// Tarjeta del panel del productor para conectar su cuenta y recibir pagos en línea.
export function CobrosMercadoPago({ conectado, conectadoEn, modoPrueba, aviso }: { conectado: boolean; conectadoEn: string | null; modoPrueba: boolean; aviso?: string }) {
  return <section id="cobros" aria-labelledby="cobros-titulo" className="mt-6 scroll-mt-24 rounded-[22px] border border-[#ebe4d4] bg-white p-6 sm:p-7">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-xl">
        <h2 id="cobros-titulo" className="text-xl font-semibold">Cobros con Mercado Pago</h2>
        <p className="mt-1 text-sm leading-relaxed text-gray-600">Conecta tu cuenta y tus compradores podrán pagarte en línea desde el pedido. El dinero llega directo a tu cuenta de Mercado Pago y el pago se confirma solo.</p>
      </div>
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${conectado ? 'bg-musgo/15 text-bosque' : 'bg-gray-100 text-gray-600'}`}>{conectado ? `Conectada${modoPrueba ? ' · modo prueba' : ''}` : 'Sin conectar'}</span>
    </div>
    {aviso && AVISOS[aviso] && <p role="status" className={`mt-4 rounded-xl px-4 py-3 text-sm ${AVISOS[aviso][0]}`}>{AVISOS[aviso][1]}</p>}
    <div className="mt-5 flex flex-wrap items-center gap-4">
      {conectado ? <>
        <p className="text-sm text-gray-600">Conectada el {new Intl.DateTimeFormat('es-PE', { dateStyle: 'long', timeZone: 'America/Lima' }).format(new Date(conectadoEn!))}.</p>
        <DesconectarMercadoPago />
      </> : <a href="/api/mercadopago/conectar" className="inline-flex min-h-11 items-center rounded-full bg-[#009ee3] px-6 text-sm font-semibold text-white hover:bg-[#0088c6]">Conectar Mercado Pago</a>}
    </div>
    <p className="mt-4 text-xs leading-relaxed text-gray-500">Te llevaremos a Mercado Pago para que autorices a AgroSignal a crear cobros a tu nombre. No vemos tu clave ni tu saldo. Puedes desconectarla cuando quieras.</p>
  </section>
}

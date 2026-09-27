'use client'

export function BotonImprimir() {
  return <button type="button" onClick={() => window.print()} className="inline-flex min-h-11 items-center rounded-full bg-naranja px-6 text-sm font-semibold text-petroleo hover:bg-[#f29a5e] print:hidden">Imprimir o guardar PDF</button>
}

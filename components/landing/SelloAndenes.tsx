'use client'

import { useState } from 'react'

// Los tres niveles del Sello como andenes circulares que suben hacia una cima
// dorada: cada anillo es una verificación independiente; la tarjeta muestra la más alta.
const NIVELES = [
  { nivel: 1, nombre: 'Documental', texto: 'El productor sube su certificado SENASA, GlobalG.A.P. u otro, y el equipo de AgroSignal lo revisa. Solo cuenta mientras esté vigente.', rx: 188, tope: '#8fab6c', muro: '#5d7a41' },
  { nivel: 2, nombre: 'Inspección con dron', texto: 'Un vuelo sobre el campo deja fotos o video, coordenadas y fecha como evidencia del cultivo real.', rx: 132, tope: '#3f6e54', muro: '#24543d' },
  { nivel: 3, nombre: 'Test de residuos', texto: 'Tiras reactivas sobre la cosecha. Si el resultado no pasa, el lote sale del catálogo al instante.', rx: 74, tope: '#e0b534', muro: '#b8860f' },
] as const

export function SelloAndenes() {
  const [activo, setActivo] = useState<number | null>(null)
  const detalle = NIVELES.find(n => n.nivel === activo)
  return <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
    <div className="relative order-2 lg:order-1" onPointerLeave={() => setActivo(null)}>
      <svg viewBox="0 0 440 290" role="img" aria-labelledby="andenes-titulo" className="w-full overflow-visible">
        <title id="andenes-titulo">Tres anillos concéntricos, como andenes circulares: documental, inspección con dron y test de residuos</title>
        {NIVELES.map(n => {
          const ry = n.rx * 0.42, y = 170 - (n.nivel - 1) * 30
          const apagado = activo !== null && activo !== n.nivel
          return <g key={n.nivel} onPointerEnter={() => setActivo(n.nivel)} className="cursor-pointer transition-[filter,transform] duration-300 ease-out motion-reduce:transition-none"
            style={{ filter: apagado ? 'saturate(0.25) brightness(1.12)' : 'none', transform: activo === n.nivel ? 'translateY(-6px)' : 'none', transformBox: 'fill-box', transformOrigin: 'center' }}>
            <ellipse cx="220" cy={y + 26} rx={n.rx} ry={ry} fill={n.muro} />
            <rect x={220 - n.rx} y={y} width={n.rx * 2} height="26" fill={n.muro} />
            <ellipse cx="220" cy={y} rx={n.rx} ry={ry} fill={n.tope} />
            <ellipse cx="220" cy={y} rx={n.rx - 10} ry={ry - 5} fill="none" stroke="#ffffff" strokeOpacity="0.18" strokeDasharray="2 7" />
          </g>
        })}
      </svg>
      <p className="mt-2 text-center text-xs text-gray-500">Inspirado en los andenes circulares de los Andes.</p>
    </div>
    <div className="order-1 lg:order-2">
      <h2 className="text-3xl font-medium leading-tight text-bosque sm:text-4xl">Un Sello de Inocuidad que se gana en el campo</h2>
      <p className="mt-4 max-w-prose leading-relaxed text-gray-700">Cada lote puede sumar tres verificaciones independientes. En el catálogo ves la más alta que alcanzó; en la ficha, el estado de las tres.</p>
      <ul className="mt-7 space-y-2">
        {NIVELES.map(n => <li key={n.nivel}>
          <button type="button" onPointerEnter={() => setActivo(n.nivel)} onFocus={() => setActivo(n.nivel)} onBlur={() => setActivo(null)} onClick={() => setActivo(activo === n.nivel ? null : n.nivel)} aria-expanded={activo === n.nivel}
            className={`flex w-full items-start gap-4 rounded-2xl px-4 py-3 text-left transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-bosque ${activo === n.nivel ? 'bg-white shadow-[var(--shadow-card)]' : 'hover:bg-white/60'}`}>
            <span aria-hidden="true" className="mt-1 size-4 shrink-0 rounded-full ring-4 ring-white" style={{ background: n.tope }} />
            <span className="min-w-0">
              <span className="block font-semibold text-gray-900">Nivel {n.nivel} · {n.nombre}</span>
              <span className={`grid transition-[grid-template-rows] duration-300 motion-reduce:transition-none ${activo === n.nivel ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}><span className="overflow-hidden"><span className="block pt-1.5 text-sm leading-relaxed text-gray-600">{n.texto}</span></span></span>
            </span>
          </button>
        </li>)}
      </ul>
      <p aria-live="polite" className="sr-only">{detalle ? `Nivel ${detalle.nivel}, ${detalle.nombre}: ${detalle.texto}` : ''}</p>
      <p className="mt-6 max-w-prose text-xs leading-relaxed text-gray-500">Son señales de verificación. El test de residuos no reemplaza un análisis de laboratorio.</p>
    </div>
  </div>
}

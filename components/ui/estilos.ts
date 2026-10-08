// Sistema de los paneles (productor, comprador, admin y precios). Sin 'use client': se usa en
// componentes de servidor y de cliente.

// Botones, todos en píldora. El principal es `buttonClass` (naranja) en components/auth/FormFields.tsx.
const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-60'
export const buttonSecondaryClass = `inline-flex min-h-11 items-center justify-center rounded-full border border-petroleo/30 bg-white px-5 py-2.5 text-sm font-semibold text-petroleo transition hover:border-petroleo/60 hover:bg-crema focus-visible:outline-petroleo ${foco}`
export const buttonDangerClass = `inline-flex min-h-11 items-center justify-center rounded-full bg-red-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800 focus-visible:outline-red-700 ${foco}`
// Abre una confirmación destructiva: contorno rojo suave, sin relleno.
export const buttonDangerSoftClass = `inline-flex min-h-11 items-center justify-center rounded-full border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-50 focus-visible:outline-red-700 ${foco}`

// Escala de títulos: página (H1, 36 px) > bloque o sección (24 px, ligero) > elemento de una lista (18 px).
// Cuerpo en text-sm (14 px) y datos secundarios en text-xs (12 px).
export const tituloPagina = 'text-3xl font-normal text-petroleo sm:text-4xl'
export const tituloBloque = 'text-xl font-normal text-petroleo sm:text-2xl'
export const tituloItem = 'text-lg font-semibold text-gray-900'

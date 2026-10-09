'use client'

import { useEffect, useRef } from 'react'

// Fondo decorativo del panel admin ("Planta tras el vidrio"): hojas pintadas en un canvas y
// desenfocadas por CSS (.adm-fondo y .adm-velo en app/admin/tema-admin.css).
// Solo aspecto: no lee datos, no usa estado de la app, no recibe props y es invisible para
// lectores de pantalla. Se monta una vez en app/admin/layout.tsx.

// Verdes de la planta, con su peso (cuántas hojas de cada tono, en proporción).
const PALETA: [string, number][] = [
  ['#2F4F1A', 2], ['#3F6418', 3], ['#5E8A24', 4], ['#86B33A', 5],
  ['#A9CF55', 4], ['#C9E58A', 3], ['#DCEBB8', 1],
]
// Grupos de hojas: [x, y] relativos al ancho/alto y escala del grupo.
const PLANTAS: [number, number, number][] = [
  [0.30, 0.30, 0.9], [0.72, 0.22, 0.7], [0.55, 0.75, 1.1], [0.12, 0.85, 0.8], [0.95, 0.70, 0.8],
]
const HOJAS_POR_PLANTA = 34
const DESTELLOS = 10
const SEMILLA = 7 // fija: el fondo se ve igual en cada visita

export function FondoFollaje() {
  const lienzo = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = lienzo.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    let semilla = SEMILLA
    const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647
    const total = PALETA.reduce((suma, [, peso]) => suma + peso, 0)
    const tono = () => {
      let resto = azar() * total
      for (const [color, peso] of PALETA) if ((resto -= peso) <= 0) return color
      return PALETA[0][0]
    }
    const hoja = (x: number, y: number, largo: number, ancho: number, angulo: number) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(angulo)
      ctx.fillStyle = tono()
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.bezierCurveTo(largo * 0.3, -ancho, largo * 0.75, -ancho * 0.8, largo, 0)
      ctx.bezierCurveTo(largo * 0.75, ancho * 0.8, largo * 0.3, ancho, 0, 0)
      ctx.fill()
      ctx.restore()
    }

    const pintar = () => {
      // A media resolución: el desenfoque de 40px hace invisible la diferencia y pesa la cuarta parte.
      const W = (canvas.width = Math.max(1, Math.round(canvas.clientWidth / 2)))
      const H = (canvas.height = Math.max(1, Math.round(canvas.clientHeight / 2)))
      semilla = SEMILLA

      const base = ctx.createLinearGradient(0, 0, 0, H)
      base.addColorStop(0, '#A5B7AC')
      base.addColorStop(1, '#93A99A')
      ctx.fillStyle = base
      ctx.fillRect(0, 0, W, H)

      for (const [px, py, escala] of PLANTAS) {
        for (let i = 0; i < HOJAS_POR_PLANTA; i++) {
          const angulo = azar() * Math.PI * 2
          const distancia = azar() * 120 * escala
          const largo = (50 + azar() * 120) * escala
          const ancho = largo * (0.28 + azar() * 0.2)
          hoja(px * W + Math.cos(angulo) * distancia, py * H + Math.sin(angulo) * distancia * 0.8, largo, ancho, angulo + (azar() - 0.5) * 0.8)
        }
      }

      ctx.globalCompositeOperation = 'screen'
      for (let i = 0; i < DESTELLOS; i++) {
        const x = azar() * W, y = azar() * H, radio = 40 + azar() * 90
        const luz = ctx.createRadialGradient(x, y, 0, x, y, radio)
        luz.addColorStop(0, 'rgba(235, 244, 215, 0.45)')
        luz.addColorStop(1, 'rgba(230, 245, 190, 0)')
        ctx.fillStyle = luz
        ctx.fillRect(x - radio, y - radio, radio * 2, radio * 2)
      }
      ctx.globalCompositeOperation = 'source-over'
    }

    pintar()
    let espera: ReturnType<typeof setTimeout> | undefined
    const alRedimensionar = () => { clearTimeout(espera); espera = setTimeout(pintar, 150) }
    window.addEventListener('resize', alRedimensionar)
    return () => { clearTimeout(espera); window.removeEventListener('resize', alRedimensionar) }
  }, [])

  return <>
    <div aria-hidden="true" className="adm-fondo"><canvas ref={lienzo} /></div>
    <div aria-hidden="true" className="adm-velo" />
  </>
}

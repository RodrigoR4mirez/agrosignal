'use client'

import { useEffect } from 'react'

// Al llegar con /ayuda#pregunta, abre esa pregunta y la lleva a la vista.
export function AbrirPreguntaEnlazada() {
  useEffect(() => {
    const abrir = () => {
      const id = decodeURIComponent(window.location.hash.slice(1))
      const pregunta = id ? document.getElementById(id) : null
      if (pregunta instanceof HTMLDetailsElement) { pregunta.open = true; pregunta.scrollIntoView({ block: 'start' }) }
    }
    abrir()
    window.addEventListener('hashchange', abrir)
    return () => window.removeEventListener('hashchange', abrir)
  }, [])
  return null
}

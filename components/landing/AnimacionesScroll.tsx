'use client'

import { useEffect } from 'react'

// Revela con fundido y desplazamiento los elementos [data-revelar] cuando entran
// en pantalla, como en producepay.com. Lo que ya está visible al cargar no se toca.
export function AnimacionesScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const observador = new IntersectionObserver(entradas => {
      for (const entrada of entradas) {
        if (!entrada.isIntersecting) continue
        entrada.target.classList.remove('revelar-oculto')
        observador.unobserve(entrada.target)
      }
    }, { rootMargin: '0px 0px -12% 0px' })
    for (const el of document.querySelectorAll('[data-revelar]')) {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.88) continue
      el.classList.add('revelar-oculto')
      observador.observe(el)
    }
    return () => observador.disconnect()
  }, [])
  return null
}

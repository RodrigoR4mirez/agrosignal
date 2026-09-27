'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { LotCard } from '@/components/marketplace/LotCard'
import type { Filters } from '@/lib/marketplace/data'
import type { LotePublico } from '@/lib/marketplace/types'

type PageResponse = { lots: LotePublico[]; nextCursor: string | null }

function respuestaValida(valor: unknown): valor is PageResponse {
  if (!valor || typeof valor !== 'object') return false
  const page = valor as Partial<PageResponse>
  return Array.isArray(page.lots) && (page.nextCursor === null || typeof page.nextCursor === 'string')
}

export function InfiniteCatalog({ initialLots, initialCursor, filters, exportHref }: {
  initialLots: LotePublico[]
  initialCursor: string | null
  filters: Filters
  exportHref: string
}) {
  const [lots, setLots] = useState(initialLots)
  const [cursor, setCursor] = useState(initialCursor)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sentinel = useRef<HTMLDivElement>(null)
  const cursorRef = useRef(initialCursor)
  const loadingRef = useRef(false)
  const requestRef = useRef<AbortController | null>(null)

  const loadMore = useCallback(async () => {
    const currentCursor = cursorRef.current
    if (!currentCursor || loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    setError(null)
    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller

    try {
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(filters)) {
        if (value) params.set(key, value)
      }
      params.set('cursor', currentCursor)
      const response = await fetch(`/api/marketplace?${params}`, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      })
      const body: unknown = await response.json().catch(() => null)
      if (!response.ok || !respuestaValida(body)) {
        const message = body && typeof body === 'object' && 'error' in body && typeof body.error === 'string' ? body.error : null
        throw new Error(message ?? 'No pudimos cargar más productos. Intenta nuevamente.')
      }
      setLots(previous => {
        const ids = new Set(previous.map(lot => lot.id))
        const nuevos = body.lots.filter(lot => typeof lot?.id === 'string' && !ids.has(lot.id))
        return nuevos.length ? [...previous, ...nuevos] : previous
      })
      cursorRef.current = body.nextCursor
      setCursor(body.nextCursor)
    } catch (reason) {
      if (!(reason instanceof DOMException && reason.name === 'AbortError')) {
        setError(reason instanceof Error ? reason.message : 'No pudimos cargar más productos. Intenta nuevamente.')
      }
    } finally {
      if (!controller.signal.aborted) {
        loadingRef.current = false
        setLoading(false)
      }
    }
  }, [filters])

  useEffect(() => () => requestRef.current?.abort(), [])

  useEffect(() => {
    const target = sentinel.current
    if (!target || !cursor || error || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting) void loadMore()
    }, { rootMargin: '800px 0px', threshold: 0 })
    observer.observe(target)
    return () => observer.disconnect()
  }, [cursor, error, loadMore])

  return <div aria-busy={loading}>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {lots.map((lot, index) => <Fragment key={lot.id}>
        <div className="min-w-0"><LotCard lot={lot} eager={index < 4} /></div>
        {index === 11 && filters.destino !== 'exportacion' && <Link href={exportHref} className="group relative isolate col-span-full flex min-h-36 items-center overflow-hidden rounded-[24px] bg-petroleo px-7 py-6 text-white sm:px-10">
          <Image src="/catalogo/exportacion-arandanos.jpg" alt="" fill sizes="100vw" className="-z-10 object-cover object-[50%_40%] opacity-60 transition-transform duration-700 group-hover:scale-105" />
          <span aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-r from-petroleo via-petroleo/80 to-transparent" />
          <span className="flex flex-wrap items-center gap-x-8 gap-y-3"><span><span className="block text-2xl font-normal sm:text-3xl">Cosechas listas para exportar</span><span className="mt-1 block text-sm text-white/80">Lotes con destino de exportación, con su origen y verificación a la vista.</span></span>
            <span className="inline-flex min-h-11 items-center rounded-full bg-naranja px-6 text-sm font-semibold text-petroleo">Ver lotes de exportación</span></span>
        </Link>}
      </Fragment>)}
    </div>

    <div ref={sentinel} aria-hidden="true" className="h-px" />
    <div className="mt-8 flex min-h-14 flex-col items-center justify-center gap-3 text-center text-sm text-gray-600" aria-live="polite">
      {loading ? <p role="status" className="inline-flex items-center gap-3"><span aria-hidden="true" className="size-5 animate-spin rounded-full border-2 border-petroleo/20 border-t-petroleo motion-reduce:animate-none" />Cargando más productos…</p> : null}
      {error ? <div role="alert"><p>{error}</p><button type="button" onClick={() => void loadMore()} className="mt-3 min-h-11 rounded-full bg-petroleo px-6 font-semibold text-white hover:bg-bosque-claro">Volver a intentar</button></div> : null}
      {cursor && !loading && !error ? <button type="button" onClick={() => void loadMore()} className="min-h-11 rounded-full bg-white px-6 font-semibold text-petroleo ring-1 ring-[#e2dbc9] hover:ring-petroleo/40">Cargar más productos</button> : null}
      {!cursor && !loading && !error ? <p>Has visto todos los productos.</p> : null}
    </div>
  </div>
}

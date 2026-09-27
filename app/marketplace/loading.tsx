// Esqueleto del catálogo mientras cargan los lotes.
export default function MarketplaceLoading() {
  return <div role="status" aria-label="Cargando productos" className="min-h-screen bg-crema">
    <div className="h-72 bg-petroleo" />
    <div className="app-container grid gap-6 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:px-8 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => <div key={i} className="animate-pulse overflow-hidden rounded-[22px] bg-white motion-reduce:animate-none">
        <div className="aspect-4/3 bg-[#efe8da]" /><div className="space-y-3 p-5"><div className="h-3 w-1/3 rounded bg-[#efe8da]" /><div className="h-6 w-2/3 rounded bg-[#efe8da]" /><div className="h-7 w-1/2 rounded bg-[#efe8da]" /></div>
      </div>)}
    </div>
  </div>
}

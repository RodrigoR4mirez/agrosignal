const CATEGORIAS = ['Frutas', 'Granos', 'Hortalizas', 'Café/Cacao']

const PRECIOS = [
  { name: 'Uva Red Globe (Kg)', price: 'S/ 4.80', change: '+2.1%', changeClass: 'text-[var(--ms-secondary-fixed)]' },
  { name: 'Arándano Biloxi (Kg)', price: 'S/ 12.50', change: '-0.5%', changeClass: 'text-red-400' },
  { name: 'Palta Hass (Kg)', price: 'S/ 7.20', change: '+1.4%', changeClass: 'text-[var(--ms-secondary-fixed)]' },
]

export function PreciosReferencia() {
  return (
    <section className="bg-[var(--ms-primary)] py-12">
      <div className="space-y-8 px-6">
        <div className="space-y-2 text-center">
          <h3 className="text-2xl leading-[32px] font-bold text-white">Precios de Referencia</h3>
          <p className="text-sm leading-5 text-[var(--ms-on-primary-container)]">Mercados mayoristas actualizados hoy.</p>
        </div>
        <div className="ms-hide-scrollbar flex gap-2 overflow-x-auto pb-4">
          {CATEGORIAS.map((cat, i) => (
            <button
              key={cat}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${
                i === 0 ? 'bg-[var(--ms-secondary-container)] text-[var(--ms-on-secondary-container)]' : 'bg-white/10 text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="space-y-4 rounded-[1rem] border border-white/10 bg-white/10 p-6">
          {PRECIOS.map((item, i) => (
            <div
              key={item.name}
              className={`flex items-center justify-between text-white ${
                i < PRECIOS.length - 1 ? 'border-b border-white/10 pb-3' : ''
              }`}
            >
              <span className="text-sm leading-5">{item.name}</span>
              <div className="text-right">
                <span className="block text-xl leading-[28px] font-semibold">{item.price}</span>
                <span className={`text-[10px] font-bold ${item.changeClass}`}>{item.change}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

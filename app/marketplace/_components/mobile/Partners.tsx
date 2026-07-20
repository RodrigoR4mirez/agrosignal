const PARTNERS = ['MINAGRI', 'SENAMHI', 'AGROBANCO']

export function Partners() {
  return (
    <section className="px-6 py-8 opacity-60">
      <div className="grid grid-cols-3 items-center gap-8 grayscale">
        {PARTNERS.map((p) => (
          <div key={p} className="text-center text-sm font-bold">
            {p}
          </div>
        ))}
      </div>
    </section>
  )
}

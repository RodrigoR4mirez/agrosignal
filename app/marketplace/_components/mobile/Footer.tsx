import { MaterialSymbol } from '../shared/MaterialSymbol'

const LINKS = ['Privacidad', 'Términos', 'Contacto', 'Soporte']

export function Footer() {
  return (
    <footer className="flex flex-col gap-8 bg-[var(--ms-surface-container-low)] px-6 py-12 text-center">
      <div className="space-y-4">
        <h4 className="text-sm font-bold tracking-widest text-[var(--ms-tertiary)] uppercase">AgroSignal</h4>
        <p className="px-4 text-sm leading-relaxed text-[var(--ms-on-surface-variant)]">
          {`© ${new Date().getFullYear()} AgroSignal. Datos provistos por NASA & FAO. Transformando el campo peruano.`}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
        {LINKS.map((link) => (
          <a key={link} className="text-sm text-[var(--ms-on-surface-variant)]" href="#">
            {link}
          </a>
        ))}
      </div>
      <div className="flex justify-center gap-4 border-t border-[var(--ms-outline-variant)]/30 pt-6">
        <button className="flex items-center gap-2 rounded-[0.5rem] bg-black px-4 py-2 text-white">
          <MaterialSymbol name="phone_iphone" className="!text-xl" />
          <span className="text-left leading-none">
            <span className="block text-[8px] opacity-60">Download on</span>
            <span className="text-xs font-bold">App Store</span>
          </span>
        </button>
        <button className="flex items-center gap-2 rounded-[0.5rem] bg-black px-4 py-2 text-white">
          <MaterialSymbol name="play_arrow" className="!text-xl" />
          <span className="text-left leading-none">
            <span className="block text-[8px] opacity-60">GET IT ON</span>
            <span className="text-xs font-bold">Google Play</span>
          </span>
        </button>
      </div>
    </footer>
  )
}

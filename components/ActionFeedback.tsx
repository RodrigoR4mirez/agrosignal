'use client'

import { createContext, useContext, useState } from 'react'

const FeedbackContext = createContext<(message: string) => void>(() => {})
export const useActionFeedback = () => useContext(FeedbackContext)

/** Kept above filtered lists so successful actions remain visible when a row leaves. */
export function ActionFeedback({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState('')
  return <FeedbackContext.Provider value={setMessage}>
    {message && <div className="sticky top-4 z-30 mb-6 flex items-start justify-between gap-4 rounded-xl border border-green-200 bg-green-50 p-4"><p role="status" className="text-sm leading-relaxed text-green-950">{message}</p><button type="button" onClick={() => setMessage('')} aria-label="Cerrar aviso de éxito" className="min-h-10 shrink-0 rounded-lg px-3 text-sm font-semibold text-green-900 hover:bg-green-100">Cerrar</button></div>}
    {children}
  </FeedbackContext.Provider>
}

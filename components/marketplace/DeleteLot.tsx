'use client'

import { useActionState, useState } from 'react'
import { deleteLot } from '@/app/panel-productor/actions'
import { FormMessage } from '@/components/auth/FormFields'
import { buttonDangerClass, buttonDangerSoftClass, buttonSecondaryClass } from '@/components/ui/estilos'

export function DeleteLot({ id, crop }: { id: string; crop: string }) {
  const [confirm, setConfirm] = useState(false)
  const [state, action, pending] = useActionState(deleteLot, {})
  if (!confirm) return <button type="button" onClick={() => setConfirm(true)} className={buttonDangerSoftClass}>Eliminar</button>
  return <form action={action} className="basis-full space-y-3 rounded-xl border border-red-200 bg-red-50 p-4">
    <input type="hidden" name="id" value={id} /><input type="hidden" name="confirmar" value="si" />
    <p className="text-sm text-red-950">¿Eliminar el lote de {crop}? Esta acción también elimina sus fotos y no se puede deshacer.</p>
    <FormMessage state={state} />
    <div className="flex flex-wrap gap-3"><button disabled={pending} className={buttonDangerClass}>{pending ? 'Eliminando…' : 'Sí, eliminar lote'}</button><button disabled={pending} type="button" onClick={() => setConfirm(false)} className={buttonSecondaryClass}>Cancelar</button></div>
  </form>
}

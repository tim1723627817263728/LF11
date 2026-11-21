// Bestätigungs-Dialog (Overlay), z. B. vor "Verbraucht" oder "Löschen".
// Schließt mit ESC oder Klick auf den Hintergrund.

import { useEffect } from 'react'
import { Button } from './Button'

interface Props {
  titel: string
  text: string
  bestaetigenText?: string
  abbrechenText?: string
  gefahr?: boolean
  onBestaetigen: () => void
  onAbbrechen: () => void
}

export function BestaetigungsDialog({
  titel,
  text,
  bestaetigenText = 'Bestätigen',
  abbrechenText = 'Abbrechen',
  gefahr = false,
  onBestaetigen,
  onAbbrechen,
}: Props) {
  useEffect(() => {
    function beiTaste(e: KeyboardEvent) {
      if (e.key === 'Escape') onAbbrechen()
    }
    window.addEventListener('keydown', beiTaste)
    return () => window.removeEventListener('keydown', beiTaste)
  }, [onAbbrechen])

  return (
    <div
      className="dialog-overlay"
      onClick={onAbbrechen}
    >
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-titel"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="dialog-titel">{titel}</h3>
        <p>{text}</p>
        <div className="dialog__aktionen">
          <Button variante="sekundaer" onClick={onAbbrechen} autoFocus>
            {abbrechenText}
          </Button>
          <Button variante={gefahr ? 'gefahr' : 'primaer'} onClick={onBestaetigen}>
            {bestaetigenText}
          </Button>
        </div>
      </div>
    </div>
  )
}

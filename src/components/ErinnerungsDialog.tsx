// Wird beim Start der App (einmal pro Browser-Sitzung) gezeigt,
// wenn Lebensmittel zeitnah verwendet oder geprüft werden sollten.

import { useEffect } from 'react'
import type { Lebensmittel } from '../types/food'
import { berechneStatus, restzeitText, tageBisFrist } from '../utils/status'
import { Button } from './Button'

interface Props {
  lebensmittel: Lebensmittel[]
  onSchliessen: () => void
  onAnzeigen: () => void
}

export function ErinnerungsDialog({ lebensmittel, onSchliessen, onAnzeigen }: Props) {
  useEffect(() => {
    function beiTaste(e: KeyboardEvent) {
      if (e.key === 'Escape') onSchliessen()
    }
    window.addEventListener('keydown', beiTaste)
    return () => window.removeEventListener('keydown', beiTaste)
  }, [onSchliessen])

  const sichtbar = lebensmittel.slice(0, 5)
  const rest = lebensmittel.length - sichtbar.length

  return (
    <div className="dialog-overlay" onClick={onSchliessen}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="erinnerung-titel"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="erinnerung-titel">Heute im Blick behalten</h3>
        <p>Diese Lebensmittel sollten zeitnah verwendet, geprüft oder entsorgt werden:</p>
        <ul className="erinnerung-liste">
          {sichtbar.map((lm) => (
            <li key={lm.id}>
              <strong>
                {lm.name}
                {berechneStatus(lm) === 'Entsorgung empfohlen' && (
                  <span className="erinnerung-liste__tag">Entsorgen</span>
                )}
              </strong>
              <span>{restzeitText(tageBisFrist(lm))}</span>
            </li>
          ))}
        </ul>
        {rest > 0 && <p className="seite__untertitel">… und {rest} weitere.</p>}
        <div className="dialog__aktionen">
          <Button variante="sekundaer" onClick={onSchliessen}>
            Verstanden
          </Button>
          <Button variante="primaer" onClick={onAnzeigen} autoFocus>
            Anzeigen
          </Button>
        </div>
      </div>
    </div>
  )
}

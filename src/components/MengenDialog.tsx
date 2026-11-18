// Dialog zum Anpassen der Restmenge ("zur Hälfte verbraucht").
// Bei Menge 0 wird das Lebensmittel als verbraucht ins Archiv verschoben.

import { useEffect, useState } from 'react'
import type { Lebensmittel } from '../types/food'
import { formatiereMenge, parseMenge } from '../utils/format'
import { Button } from './Button'

interface Props {
  lebensmittel: Lebensmittel
  onSpeichern: (neueMenge: number) => void
  onAbbrechen: () => void
}

export function MengenDialog({ lebensmittel, onSpeichern, onAbbrechen }: Props) {
  const [text, setText] = useState(formatiereMenge(lebensmittel.menge))
  const [fehler, setFehler] = useState('')

  useEffect(() => {
    function beiTaste(e: KeyboardEvent) {
      if (e.key === 'Escape') onAbbrechen()
    }
    window.addEventListener('keydown', beiTaste)
    return () => window.removeEventListener('keydown', beiTaste)
  }, [onAbbrechen])

  function speichern() {
    const menge = parseMenge(text)
    if (!Number.isFinite(menge) || menge < 0) {
      setFehler('Bitte eine Zahl ab 0 eingeben (z. B. 0,5).')
      return
    }
    onSpeichern(menge)
  }

  const halb = Math.round((lebensmittel.menge / 2) * 100) / 100

  return (
    <div className="dialog-overlay" onClick={onAbbrechen}>
      <form
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mengen-titel"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          speichern()
        }}
      >
        <h3 id="mengen-titel">Restmenge anpassen</h3>
        <p>
          Wie viel von „{lebensmittel.name}“ ist noch übrig? Bei 0 wird es als verbraucht
          ins Archiv verschoben.
        </p>

        <div className="formular__feld">
          <label htmlFor="rest-menge">Rest in {lebensmittel.einheit}</label>
          <input
            id="rest-menge"
            type="text"
            inputMode="decimal"
            value={text}
            autoFocus
            onChange={(e) => {
              setText(e.target.value)
              setFehler('')
            }}
          />
          {fehler && <p className="formular__fehler">{fehler}</p>}
        </div>

        <div className="chips">
          <button type="button" className="chip" onClick={() => setText(formatiereMenge(halb))}>
            Hälfte ({formatiereMenge(halb)})
          </button>
          <button type="button" className="chip" onClick={() => setText('0')}>
            Alles weg (0)
          </button>
        </div>

        <div className="dialog__aktionen">
          <Button type="button" variante="sekundaer" onClick={onAbbrechen}>
            Abbrechen
          </Button>
          <Button type="submit" variante="primaer">
            Speichern
          </Button>
        </div>
      </form>
    </div>
  )
}

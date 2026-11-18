// Kleine Auswertung: Wie viel Prozent der abgeschlossenen Lebensmittel
// wurden verbraucht (statt weggeworfen)? Zeigt Zahlen UND einen Balken.

import type { Lebensmittel } from '../types/food'
import { berechneBilanz } from '../utils/bilanz'

interface Props {
  archiv: Lebensmittel[]
}

export function Bilanz({ archiv }: Props) {
  const b = berechneBilanz(archiv)
  if (b.gesamt === 0) return null

  const zusammenfassung = `${b.verbraucht} von ${b.gesamt} Lebensmitteln wurden verbraucht, ${b.weggeworfen} weggeworfen.`

  return (
    <section className="bilanz" aria-label="Bilanz">
      <div className="bilanz__kopf">
        <h2 className="bilanz__titel">Deine Bilanz</h2>
        <span className="bilanz__quote">{b.quote} % verbraucht</span>
      </div>
      <div className="bilanz__balken" role="img" aria-label={zusammenfassung}>
        <span className="bilanz__teil bilanz__teil--verbraucht" style={{ flexGrow: b.verbraucht }} />
        <span className="bilanz__teil bilanz__teil--weggeworfen" style={{ flexGrow: b.weggeworfen }} />
      </div>
      <p className="bilanz__text">{zusammenfassung}</p>
    </section>
  )
}

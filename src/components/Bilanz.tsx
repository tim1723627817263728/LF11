// Kleine Auswertung: Wie viel Prozent der abgeschlossenen Lebensmittel
// wurden verbraucht (statt weggeworfen)? Zeigt Zahlen UND einen Balken.
// Mit "detail" zusätzlich: Welche Kategorien werden am häufigsten weggeworfen?

import type { Lebensmittel } from '../types/food'
import { berechneBilanz } from '../utils/bilanz'

interface Props {
  archiv: Lebensmittel[]
  detail?: boolean
}

export function Bilanz({ archiv, detail = false }: Props) {
  const b = berechneBilanz(archiv)
  if (b.gesamt === 0) return null

  const zusammenfassung = `${b.verbraucht} von ${b.gesamt} Lebensmitteln wurden verbraucht, ${b.weggeworfen} weggeworfen.`
  const top = b.weggeworfenNachKategorie.slice(0, 3)
  const maximum = top[0]?.anzahl ?? 1

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

      {top.length > 0 && !detail && (
        <p className="bilanz__text bilanz__text--kategorie">
          Am häufigsten weggeworfen: <strong>{top[0].kategorie}</strong> ({top[0].anzahl}×)
        </p>
      )}

      {top.length > 0 && detail && (
        <div className="bilanz__kategorien">
          <h3 className="bilanz__unterueberschrift">Am häufigsten weggeworfen</h3>
          <ul className="bilanz__liste">
            {top.map((eintrag) => (
              <li key={eintrag.kategorie} className="bilanz__zeile">
                <span className="bilanz__name">{eintrag.kategorie}</span>
                <span className="bilanz__leiste" aria-hidden="true">
                  <span
                    className="bilanz__fuellung"
                    style={{ width: `${(eintrag.anzahl / maximum) * 100}%` }}
                  />
                </span>
                <span className="bilanz__anzahl">{eintrag.anzahl}×</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

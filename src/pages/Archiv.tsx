// Archiv: alle verbrauchten oder weggeworfenen Lebensmittel plus Bilanz.
// Einträge können wiederhergestellt, auf die Einkaufsliste gesetzt
// oder endgültig gelöscht werden.

import { useState } from 'react'
import type { Lebensmittel } from '../types/food'
import { formatiereDatum } from '../utils/datum'
import { formatiereMenge } from '../utils/format'
import { berechneStatus } from '../utils/status'
import { StatusBadge } from '../components/StatusBadge'
import { Bilanz } from '../components/Bilanz'
import { Button } from '../components/Button'
import { BestaetigungsDialog } from '../components/BestaetigungsDialog'

interface Props {
  archivierteLebensmittel: Lebensmittel[]
  onWiederherstellen: (id: string) => void
  onNochmalKaufen: (lebensmittel: Lebensmittel) => void
  onLoeschen: (ids: string[]) => void
  onArchivLeeren: () => void
}

type Aktion = { typ: 'loeschen'; lebensmittel: Lebensmittel } | { typ: 'leeren' } | null

export function Archiv({
  archivierteLebensmittel,
  onWiederherstellen,
  onNochmalKaufen,
  onLoeschen,
  onArchivLeeren,
}: Props) {
  const [aktion, setAktion] = useState<Aktion>(null)

  // Zuletzt abgeschlossene zuerst; ältere Einträge ohne Zeitstempel ans Ende.
  const sortiert = [...archivierteLebensmittel].sort((a, b) =>
    (b.verbrauchtAm ?? '').localeCompare(a.verbrauchtAm ?? ''),
  )

  function bestaetige() {
    if (aktion?.typ === 'loeschen') onLoeschen([aktion.lebensmittel.id])
    if (aktion?.typ === 'leeren') onArchivLeeren()
    setAktion(null)
  }

  return (
    <section className="seite">
      <h1>Archiv</h1>
      <p className="seite__untertitel">Verbrauchte und weggeworfene Lebensmittel</p>

      <Bilanz archiv={archivierteLebensmittel} />

      {sortiert.length === 0 ? (
        <p className="leer">Noch keine abgeschlossenen Lebensmittel.</p>
      ) : (
        <>
          <div className="karten-liste">
            {sortiert.map((lebensmittel) => (
              <article key={lebensmittel.id} className="karte karte--archiv">
                <div className="karte__kopf">
                  <h3 className="karte__titel">{lebensmittel.name}</h3>
                  <StatusBadge status={berechneStatus(lebensmittel)} />
                </div>
                <dl className="karte__details">
                  <div className="karte__zeile">
                    <dt>Menge</dt>
                    <dd>
                      {formatiereMenge(lebensmittel.menge)} {lebensmittel.einheit}
                    </dd>
                  </div>
                  <div className="karte__zeile">
                    <dt>Lagerort</dt>
                    <dd>{lebensmittel.lagerort}</dd>
                  </div>
                  <div className="karte__zeile">
                    <dt>{lebensmittel.datumsart}</dt>
                    <dd>{formatiereDatum(lebensmittel.datum)}</dd>
                  </div>
                </dl>
                <div className="karte__aktionen">
                  <Button variante="sekundaer" onClick={() => onWiederherstellen(lebensmittel.id)}>
                    Wiederherstellen
                  </Button>
                  <Button variante="primaer" onClick={() => onNochmalKaufen(lebensmittel)}>
                    Nochmal kaufen
                  </Button>
                  <Button variante="gefahr" onClick={() => setAktion({ typ: 'loeschen', lebensmittel })}>
                    Löschen
                  </Button>
                </div>
              </article>
            ))}
          </div>
          <div className="archiv__fuss">
            <Button variante="gefahr" onClick={() => setAktion({ typ: 'leeren' })}>
              Archiv leeren
            </Button>
          </div>
        </>
      )}

      {aktion && (
        <BestaetigungsDialog
          titel={aktion.typ === 'leeren' ? 'Archiv leeren?' : 'Endgültig löschen?'}
          text={
            aktion.typ === 'leeren'
              ? `Alle ${sortiert.length} Einträge im Archiv werden unwiderruflich gelöscht. Die Bilanz wird dadurch zurückgesetzt.`
              : `„${aktion.lebensmittel.name}“ wird unwiderruflich gelöscht.`
          }
          bestaetigenText="Löschen"
          gefahr
          onBestaetigen={bestaetige}
          onAbbrechen={() => setAktion(null)}
        />
      )}
    </section>
  )
}

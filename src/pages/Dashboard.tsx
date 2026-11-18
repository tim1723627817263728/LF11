// Startseite: Zusammenfassung nach Status und die fünf Lebensmittel,
// die als Nächstes geprüft/verwendet werden sollten.

import type { Lebensmittel, Status } from '../types/food'
import {
  berechneStatus,
  restzeitText,
  tageBisDatum,
  vergleicheDringlichkeit,
} from '../utils/status'
import { formatiereDatum } from '../utils/datum'
import { StatusBadge } from '../components/StatusBadge'
import { Button } from '../components/Button'
import { Bilanz } from '../components/Bilanz'

interface Props {
  aktiveLebensmittel: Lebensmittel[]
  archivierteLebensmittel: Lebensmittel[]
  onLebensmittelHinzufuegen: () => void
  onAlleAnzeigen: () => void
}

const ZAEHLER: { status: Status; klasse: string; label: string }[] = [
  { status: 'Zeitnah verwenden oder prüfen', klasse: 'zeitnah', label: 'Zeitnah prüfen' },
  { status: 'Bald prüfen', klasse: 'bald', label: 'Bald prüfen' },
  { status: 'Frisch', klasse: 'frisch', label: 'Frisch' },
]

export function Dashboard({
  aktiveLebensmittel,
  archivierteLebensmittel,
  onLebensmittelHinzufuegen,
  onAlleAnzeigen,
}: Props) {
  const dringendeListe = [...aktiveLebensmittel].sort(vergleicheDringlichkeit).slice(0, 5)
  const anzahlZeitnah = aktiveLebensmittel.filter(
    (lm) => berechneStatus(lm) === 'Zeitnah verwenden oder prüfen',
  ).length

  return (
    <section className="seite seite--schmal">
      <h1>Dein Überblick für heute</h1>

      {anzahlZeitnah > 0 && (
        <p className="erinnerung" role="status">
          {anzahlZeitnah === 1
            ? '1 Lebensmittel sollte zeitnah verwendet oder geprüft werden.'
            : `${anzahlZeitnah} Lebensmittel sollten zeitnah verwendet oder geprüft werden.`}
        </p>
      )}

      <div className="zaehler">
        {ZAEHLER.map((z) => (
          <div key={z.status} className={`zaehler__feld zaehler__feld--${z.klasse}`}>
            <span className="zaehler__zahl">
              {aktiveLebensmittel.filter((lm) => berechneStatus(lm) === z.status).length}
            </span>
            <span className="zaehler__text">{z.label}</span>
          </div>
        ))}
      </div>

      <Bilanz archiv={archivierteLebensmittel} />

      <h2>Zuerst verwenden oder prüfen</h2>

      {dringendeListe.length === 0 ? (
        <p className="leer">Aktuell keine aktiven Lebensmittel vorhanden.</p>
      ) : (
        <ul className="dashboard__liste">
          {dringendeListe.map((lebensmittel) => (
            <li key={lebensmittel.id} className="dashboard__eintrag">
              <div className="dashboard__eintrag-info">
                <strong>{lebensmittel.name}</strong>
                <span className="dashboard__eintrag-datum">
                  {lebensmittel.datumsart}: {formatiereDatum(lebensmittel.datum)} ·{' '}
                  {restzeitText(tageBisDatum(lebensmittel.datum))}
                </span>
              </div>
              <StatusBadge status={berechneStatus(lebensmittel)} />
            </li>
          ))}
        </ul>
      )}

      <div className="dashboard__aktionen">
        <Button variante="primaer" onClick={onLebensmittelHinzufuegen}>
          Lebensmittel hinzufügen
        </Button>
        {aktiveLebensmittel.length > 5 && (
          <Button variante="sekundaer" onClick={onAlleAnzeigen}>
            Alle {aktiveLebensmittel.length} anzeigen
          </Button>
        )}
      </div>
    </section>
  )
}

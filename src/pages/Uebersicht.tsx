// Seite mit allen aktiven Lebensmitteln: Suche, Filter, Sortierung,
// Mehrfachauswahl und die Karten mit den Aktions-Buttons.
// "Verbraucht" und "Weggeworfen" gehen ohne Rückfrage (die App zeigt danach
// "Rückgängig"). Nur das endgültige Löschen fragt vorher nach.
// Bei "Bearbeiten" wird auf das Formular umgeschaltet.

import { useMemo, useState } from 'react'
import type {
  ArchivGrund,
  Lagerort,
  Lebensmittel,
  LebensmittelFormDaten,
  Status,
} from '../types/food'
import { berechneStatus, vergleicheDringlichkeit } from '../utils/status'
import { kategorieVon } from '../utils/haltbarkeit'
import { KATEGORIEN } from '../utils/kategorien'
import type { Kategorie } from '../utils/kategorien'
import { LebensmittelKarte } from '../components/LebensmittelKarte'
import { BestaetigungsDialog } from '../components/BestaetigungsDialog'
import { MengenDialog } from '../components/MengenDialog'
import { LebensmittelFormular } from '../components/LebensmittelFormular'
import { Button } from '../components/Button'

interface Props {
  aktiveLebensmittel: Lebensmittel[]
  onBearbeiten: (id: string, daten: LebensmittelFormDaten) => void
  onAbschliessen: (ids: string[], grund: ArchivGrund) => void
  onMengeAendern: (id: string, menge: number) => void
  onLoeschen: (ids: string[]) => void
}

type Sortierung = 'dringlichkeit' | 'name' | 'lagerort' | 'neu'

const LAGERORT_REIHENFOLGE: Lagerort[] = ['Kühlschrank', 'Gefrierfach', 'Vorratsschrank']

// Das endgültige Löschen wartet auf Bestätigung ("ids" kann mehrere Einträge enthalten).
interface LoeschAnfrage {
  ids: string[]
  name: string // bei genau einem Eintrag dessen Name
  endetBearbeitung?: boolean // true, wenn aus dem Bearbeiten-Formular gestartet
}

export function Uebersicht({
  aktiveLebensmittel,
  onBearbeiten,
  onAbschliessen,
  onMengeAendern,
  onLoeschen,
}: Props) {
  const [suchtext, setSuchtext] = useState('')
  const [lagerortFilter, setLagerortFilter] = useState<Lagerort | 'Alle'>('Alle')
  const [statusFilter, setStatusFilter] = useState<Status | 'Alle'>('Alle')
  const [kategorieFilter, setKategorieFilter] = useState<Kategorie | 'Alle'>('Alle')
  const [sortierung, setSortierung] = useState<Sortierung>('dringlichkeit')
  const [bearbeitetesLebensmittel, setBearbeitetesLebensmittel] =
    useState<Lebensmittel | null>(null)
  const [mengeLebensmittel, setMengeLebensmittel] = useState<Lebensmittel | null>(null)
  const [loeschAnfrage, setLoeschAnfrage] = useState<LoeschAnfrage | null>(null)
  const [auswahlModus, setAuswahlModus] = useState(false)
  const [auswahl, setAuswahl] = useState<string[]>([])

  // Im Filter nur Kategorien anbieten, die es bei den aktiven Lebensmitteln gibt.
  const vorhandeneKategorien = KATEGORIEN.filter((k) =>
    aktiveLebensmittel.some((lm) => kategorieVon(lm) === k),
  )

  const gefilterteListe = useMemo(() => {
    const gefiltert = aktiveLebensmittel
      .filter((lm) => lm.name.toLowerCase().includes(suchtext.trim().toLowerCase()))
      .filter((lm) => (lagerortFilter === 'Alle' ? true : lm.lagerort === lagerortFilter))
      .filter((lm) => (statusFilter === 'Alle' ? true : berechneStatus(lm) === statusFilter))
      .filter((lm) => (kategorieFilter === 'Alle' ? true : kategorieVon(lm) === kategorieFilter))

    switch (sortierung) {
      case 'name':
        return gefiltert.sort((a, b) => a.name.localeCompare(b.name, 'de'))
      case 'lagerort':
        return gefiltert.sort(
          (a, b) =>
            LAGERORT_REIHENFOLGE.indexOf(a.lagerort) - LAGERORT_REIHENFOLGE.indexOf(b.lagerort) ||
            vergleicheDringlichkeit(a, b),
        )
      case 'neu':
        return gefiltert.sort((a, b) => b.erstelltAm.localeCompare(a.erstelltAm))
      default:
        return gefiltert.sort(vergleicheDringlichkeit)
    }
  }, [aktiveLebensmittel, suchtext, lagerortFilter, statusFilter, kategorieFilter, sortierung])

  // Nur Einträge, die es noch gibt und die gerade sichtbar sind, zählen als ausgewählt.
  const sichtbareIds = gefilterteListe.map((lm) => lm.id)
  const gueltigeAuswahl = auswahl.filter((id) => sichtbareIds.includes(id))

  function auswahlWechseln(lm: Lebensmittel) {
    setAuswahl((alt) => (alt.includes(lm.id) ? alt.filter((id) => id !== lm.id) : [...alt, lm.id]))
  }

  function auswahlModusBeenden() {
    setAuswahlModus(false)
    setAuswahl([])
  }

  function sammelAbschliessen(grund: ArchivGrund) {
    onAbschliessen(gueltigeAuswahl, grund)
    auswahlModusBeenden()
  }

  function bestaetigeLoeschen() {
    if (!loeschAnfrage) return
    onLoeschen(loeschAnfrage.ids)
    if (loeschAnfrage.endetBearbeitung) setBearbeitetesLebensmittel(null)
    if (loeschAnfrage.ids.length > 1) auswahlModusBeenden()
    setLoeschAnfrage(null)
  }

  const loeschDialog = loeschAnfrage && (
    <BestaetigungsDialog
      titel="Lebensmittel löschen?"
      text={`${
        loeschAnfrage.ids.length > 1 ? `${loeschAnfrage.ids.length} Lebensmittel` : `„${loeschAnfrage.name}“`
      } ${loeschAnfrage.ids.length > 1 ? 'werden' : 'wird'} gelöscht und fließt nicht in die Bilanz ein.`}
      bestaetigenText="Löschen"
      gefahr
      onBestaetigen={bestaetigeLoeschen}
      onAbbrechen={() => setLoeschAnfrage(null)}
    />
  )

  // Wenn ein Lebensmittel bearbeitet wird, zeigen wir statt der Liste
  // das Formular mit den vorausgefüllten Daten an.
  if (bearbeitetesLebensmittel) {
    return (
      <section className="seite">
        <h1>Lebensmittel bearbeiten</h1>
        <LebensmittelFormular
          bestehendesLebensmittel={bearbeitetesLebensmittel}
          onSpeichern={(daten) => {
            onBearbeiten(bearbeitetesLebensmittel.id, daten)
            setBearbeitetesLebensmittel(null)
          }}
          onAbbrechen={() => setBearbeitetesLebensmittel(null)}
          onLoeschen={() =>
            setLoeschAnfrage({
              ids: [bearbeitetesLebensmittel.id],
              name: bearbeitetesLebensmittel.name,
              endetBearbeitung: true,
            })
          }
        />
        {loeschDialog}
      </section>
    )
  }

  return (
    <section className="seite">
      <h1>Lebensmittelübersicht</h1>

      <div className="filterleiste">
        <input
          type="text"
          className="filterleiste__suche"
          placeholder="Nach Name suchen..."
          value={suchtext}
          onChange={(e) => setSuchtext(e.target.value)}
          aria-label="Nach Name suchen"
        />
        <select
          className="filterleiste__auswahl"
          value={lagerortFilter}
          onChange={(e) => setLagerortFilter(e.target.value as Lagerort | 'Alle')}
          aria-label="Nach Lagerort filtern"
        >
          <option value="Alle">Alle Lagerorte</option>
          <option value="Kühlschrank">Kühlschrank</option>
          <option value="Gefrierfach">Gefrierfach</option>
          <option value="Vorratsschrank">Vorratsschrank</option>
        </select>
        <select
          className="filterleiste__auswahl"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as Status | 'Alle')}
          aria-label="Nach Status filtern"
        >
          <option value="Alle">Alle Status</option>
          <option value="Frisch">Frisch</option>
          <option value="Bald prüfen">Bald prüfen</option>
          <option value="Zeitnah verwenden oder prüfen">Zeitnah verwenden</option>
          <option value="Entsorgung empfohlen">Entsorgen</option>
        </select>
        <select
          className="filterleiste__auswahl"
          value={kategorieFilter}
          onChange={(e) => setKategorieFilter(e.target.value as Kategorie | 'Alle')}
          aria-label="Nach Kategorie filtern"
        >
          <option value="Alle">Alle Kategorien</option>
          {vorhandeneKategorien.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <select
          className="filterleiste__auswahl"
          value={sortierung}
          onChange={(e) => setSortierung(e.target.value as Sortierung)}
          aria-label="Sortieren nach"
        >
          <option value="dringlichkeit">Dringlichkeit</option>
          <option value="name">Name A–Z</option>
          <option value="lagerort">Lagerort</option>
          <option value="neu">Neueste zuerst</option>
        </select>
      </div>

      <div className="listenkopf">
        <p className="zaehlzeile">
          {gefilterteListe.length} von {aktiveLebensmittel.length} Lebensmitteln
        </p>
        {aktiveLebensmittel.length > 0 &&
          (auswahlModus ? (
            <Button variante="sekundaer" className="btn--klein" onClick={auswahlModusBeenden}>
              Auswahl beenden
            </Button>
          ) : (
            <Button variante="sekundaer" className="btn--klein" onClick={() => setAuswahlModus(true)}>
              Mehrere auswählen
            </Button>
          ))}
      </div>

      {gefilterteListe.length === 0 ? (
        <p className="leer">Keine Lebensmittel gefunden.</p>
      ) : (
        <div className="karten-liste">
          {gefilterteListe.map((lebensmittel) => (
            <LebensmittelKarte
              key={lebensmittel.id}
              lebensmittel={lebensmittel}
              onBearbeiten={setBearbeitetesLebensmittel}
              onVerbraucht={(lm) => onAbschliessen([lm.id], 'verbraucht')}
              onWeggeworfen={(lm) => onAbschliessen([lm.id], 'weggeworfen')}
              onRestAnpassen={setMengeLebensmittel}
              auswahlModus={auswahlModus}
              ausgewaehlt={gueltigeAuswahl.includes(lebensmittel.id)}
              onAuswahlWechseln={auswahlWechseln}
            />
          ))}
        </div>
      )}

      {auswahlModus && (
        <div className="auswahlleiste" role="region" aria-label="Aktionen für die Auswahl">
          <div className="auswahlleiste__kopf">
            <strong>{gueltigeAuswahl.length} ausgewählt</strong>
            <button
              type="button"
              className="linkbutton"
              onClick={() =>
                setAuswahl(gueltigeAuswahl.length === sichtbareIds.length ? [] : sichtbareIds)
              }
            >
              {gueltigeAuswahl.length === sichtbareIds.length ? 'Keine' : 'Alle'} auswählen
            </button>
          </div>
          <div className="auswahlleiste__aktionen">
            <Button
              variante="primaer"
              disabled={gueltigeAuswahl.length === 0}
              onClick={() => sammelAbschliessen('verbraucht')}
            >
              Verbraucht
            </Button>
            <Button
              variante="sekundaer"
              disabled={gueltigeAuswahl.length === 0}
              onClick={() => sammelAbschliessen('weggeworfen')}
            >
              Weggeworfen
            </Button>
            <Button
              variante="gefahr"
              disabled={gueltigeAuswahl.length === 0}
              onClick={() => setLoeschAnfrage({ ids: gueltigeAuswahl, name: '' })}
            >
              Löschen
            </Button>
          </div>
        </div>
      )}

      {mengeLebensmittel && (
        <MengenDialog
          lebensmittel={mengeLebensmittel}
          onSpeichern={(menge) => {
            onMengeAendern(mengeLebensmittel.id, menge)
            setMengeLebensmittel(null)
          }}
          onAbbrechen={() => setMengeLebensmittel(null)}
        />
      )}

      {loeschDialog}
    </section>
  )
}

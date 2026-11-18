// Seite mit allen aktiven Lebensmitteln: Suche, Filter, Sortierung,
// Mehrfachauswahl und die Karten mit den Aktions-Buttons.
// Kümmert sich auch um die Bestätigungs-Dialoge und schaltet bei
// "Bearbeiten" auf das Formular um.

import { useMemo, useState } from 'react'
import type {
  ArchivGrund,
  Lagerort,
  Lebensmittel,
  LebensmittelFormDaten,
  Status,
} from '../types/food'
import { berechneStatus, vergleicheDringlichkeit } from '../utils/status'
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

// Welche Aktion wartet auf Bestätigung? "ids" kann mehrere Einträge enthalten.
interface AusstehendeAktion {
  typ: 'verbraucht' | 'weggeworfen' | 'loeschen'
  ids: string[]
  name: string // bei genau einem Eintrag dessen Name
  endetBearbeitung?: boolean // true, wenn aus dem Bearbeiten-Formular gestartet
}

function dialogTexte(a: AusstehendeAktion) {
  const mehrere = a.ids.length > 1
  const objekt = mehrere ? `${a.ids.length} Lebensmittel` : `„${a.name}“`
  switch (a.typ) {
    case 'verbraucht':
      return {
        titel: 'Als verbraucht markieren?',
        text: `${objekt} ${mehrere ? 'werden' : 'wird'} als verbraucht ins Archiv verschoben.`,
        button: 'Verbraucht',
      }
    case 'weggeworfen':
      return {
        titel: 'Als weggeworfen markieren?',
        text: `${objekt} ${mehrere ? 'werden' : 'wird'} als weggeworfen ins Archiv verschoben und fließt in die Bilanz ein.`,
        button: 'Weggeworfen',
      }
    case 'loeschen':
      return {
        titel: mehrere ? 'Lebensmittel löschen?' : 'Lebensmittel löschen?',
        text: `${objekt} ${mehrere ? 'werden' : 'wird'} unwiderruflich gelöscht (ohne Eintrag in der Bilanz).`,
        button: 'Löschen',
      }
  }
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
  const [sortierung, setSortierung] = useState<Sortierung>('dringlichkeit')
  const [bearbeitetesLebensmittel, setBearbeitetesLebensmittel] =
    useState<Lebensmittel | null>(null)
  const [mengeLebensmittel, setMengeLebensmittel] = useState<Lebensmittel | null>(null)
  const [ausstehendeAktion, setAusstehendeAktion] = useState<AusstehendeAktion | null>(null)
  const [auswahlModus, setAuswahlModus] = useState(false)
  const [auswahl, setAuswahl] = useState<string[]>([])

  const gefilterteListe = useMemo(() => {
    const gefiltert = aktiveLebensmittel
      .filter((lm) => lm.name.toLowerCase().includes(suchtext.trim().toLowerCase()))
      .filter((lm) => (lagerortFilter === 'Alle' ? true : lm.lagerort === lagerortFilter))
      .filter((lm) => (statusFilter === 'Alle' ? true : berechneStatus(lm) === statusFilter))

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
  }, [aktiveLebensmittel, suchtext, lagerortFilter, statusFilter, sortierung])

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

  function bestaetigeAktion() {
    if (!ausstehendeAktion) return
    if (ausstehendeAktion.typ === 'loeschen') {
      onLoeschen(ausstehendeAktion.ids)
    } else {
      onAbschliessen(ausstehendeAktion.ids, ausstehendeAktion.typ)
    }
    if (ausstehendeAktion.endetBearbeitung) setBearbeitetesLebensmittel(null)
    if (ausstehendeAktion.ids.length > 1) auswahlModusBeenden()
    setAusstehendeAktion(null)
  }

  function einzelneAktion(typ: AusstehendeAktion['typ'], lm: Lebensmittel, endetBearbeitung = false) {
    setAusstehendeAktion({ typ, ids: [lm.id], name: lm.name, endetBearbeitung })
  }

  const dialog = ausstehendeAktion && (
    <BestaetigungsDialog
      titel={dialogTexte(ausstehendeAktion).titel}
      text={dialogTexte(ausstehendeAktion).text}
      bestaetigenText={dialogTexte(ausstehendeAktion).button}
      gefahr={ausstehendeAktion.typ === 'loeschen'}
      onBestaetigen={bestaetigeAktion}
      onAbbrechen={() => setAusstehendeAktion(null)}
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
          onLoeschen={() => einzelneAktion('loeschen', bearbeitetesLebensmittel, true)}
        />
        {dialog}
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
          <option value="Zeitnah verwenden oder prüfen">Zeitnah verwenden oder prüfen</option>
        </select>
        <select
          className="filterleiste__auswahl filterleiste__auswahl--breit"
          value={sortierung}
          onChange={(e) => setSortierung(e.target.value as Sortierung)}
          aria-label="Sortieren nach"
        >
          <option value="dringlichkeit">Sortiert nach Dringlichkeit</option>
          <option value="name">Sortiert nach Name (A–Z)</option>
          <option value="lagerort">Sortiert nach Lagerort</option>
          <option value="neu">Zuletzt hinzugefügt zuerst</option>
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
              onVerbraucht={(lm) => einzelneAktion('verbraucht', lm)}
              onWeggeworfen={(lm) => einzelneAktion('weggeworfen', lm)}
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
            {(['verbraucht', 'weggeworfen', 'loeschen'] as const).map((typ) => (
              <Button
                key={typ}
                variante={typ === 'verbraucht' ? 'primaer' : typ === 'loeschen' ? 'gefahr' : 'sekundaer'}
                disabled={gueltigeAuswahl.length === 0}
                onClick={() =>
                  setAusstehendeAktion({ typ, ids: gueltigeAuswahl, name: '' })
                }
              >
                {typ === 'verbraucht' ? 'Verbraucht' : typ === 'weggeworfen' ? 'Weggeworfen' : 'Löschen'}
              </Button>
            ))}
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

      {dialog}
    </section>
  )
}

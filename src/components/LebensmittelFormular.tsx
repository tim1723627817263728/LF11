// Formular zum Hinzufügen ODER Bearbeiten eines Lebensmittels.
// Wird sowohl auf der "Hinzufügen"-Seite als auch beim Bearbeiten
// aus der Übersicht verwendet (per Prop "bestehendesLebensmittel").
//
// - Die Kategorie ist eine feste Auswahl (Pflichtfeld), damit die Haltbarkeits-
//   Regeln zuverlässig greifen. Aus dem Namen wird nur ein Vorschlag gemacht.
// - Bei passenden Kategorien kann "bereits geöffnet" angegeben werden.
// - Ungespeicherte Eingaben meldet das Formular an die App (Warnung beim Verlassen).

import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type {
  Datumsart,
  Lagerort,
  Lebensmittel,
  LebensmittelFormDaten,
} from '../types/food'
import { hinweisFuerDatumsart } from '../utils/status'
import { heuteAlsString, istGueltigesDatum } from '../utils/datum'
import { formatiereMenge, parseMenge, tageDativ } from '../utils/format'
import { VORLAGEN, vorlageZuFormDaten } from '../utils/vorlagen'
import { KATEGORIEN, KATEGORIE_INFO, erkenneKategorie, istKategorie } from '../utils/kategorien'
import { kannGeoeffnetWerden } from '../utils/haltbarkeit'
import { useFormularWaechter } from '../hooks/useFormularWaechter'
import { HinweisBox } from './HinweisBox'
import { Button } from './Button'

interface Props {
  bestehendesLebensmittel?: Lebensmittel
  // Vorausgefüllte Werte beim Neuanlegen (z. B. von der Einkaufsliste)
  startwerte?: Partial<LebensmittelFormDaten>
  onSpeichern: (daten: LebensmittelFormDaten) => void
  onAbbrechen: () => void
  // Nur beim Bearbeiten: zeigt unten den "Löschen"-Button
  onLoeschen?: () => void
}

// Fehlermeldungen pro Feldname, leer = kein Fehler
interface Fehler {
  name?: string
  menge?: string
  kategorie?: string
  datum?: string
  geoeffnetAm?: string
}

const leeresFormular: LebensmittelFormDaten = {
  name: '',
  menge: 1,
  einheit: 'Stück',
  kategorie: '',
  lagerort: 'Kühlschrank',
  datumsart: 'MHD',
  datum: '',
  notiz: '',
}

// Ausgangswerte des Formulars (aus bestehendem Eintrag oder Startwerten)
function baueStart(bestehend?: Lebensmittel, startwerte?: Partial<LebensmittelFormDaten>) {
  const formular: LebensmittelFormDaten = bestehend
    ? {
        name: bestehend.name,
        menge: bestehend.menge,
        einheit: bestehend.einheit,
        kategorie: bestehend.kategorie,
        lagerort: bestehend.lagerort,
        datumsart: bestehend.datumsart,
        datum: bestehend.datum,
        notiz: bestehend.notiz ?? '',
      }
    : { ...leeresFormular, ...startwerte }
  if (!istKategorie(formular.kategorie)) formular.kategorie = ''
  return {
    formular,
    mengeText: formatiereMenge(formular.menge),
    geoeffnet: Boolean(bestehend?.geoeffnetAm),
    geoeffnetDatum: bestehend?.geoeffnetAm ?? '',
  }
}

export function LebensmittelFormular({
  bestehendesLebensmittel,
  startwerte,
  onSpeichern,
  onAbbrechen,
  onLoeschen,
}: Props) {
  const [start] = useState(() => baueStart(bestehendesLebensmittel, startwerte))
  const [formular, setFormular] = useState<LebensmittelFormDaten>(start.formular)
  // Menge als Text halten, damit Eingaben wie "1,5" oder ein leeres Feld
  // beim Tippen nicht sofort zu 0/NaN werden.
  const [mengeText, setMengeText] = useState(start.mengeText)
  const [geoeffnet, setGeoeffnet] = useState(start.geoeffnet)
  const [geoeffnetDatum, setGeoeffnetDatum] = useState(start.geoeffnetDatum)
  const [fehler, setFehler] = useState<Fehler>({})
  // Hat der Nutzer die Kategorie selbst gewählt? Dann ändern wir sie nicht mehr
  // automatisch, wenn der Name angepasst wird.
  const [kategorieManuell, setKategorieManuell] = useState(
    Boolean(bestehendesLebensmittel) || istKategorie(start.formular.kategorie),
  )
  const [kategorieVorgeschlagen, setKategorieVorgeschlagen] = useState(false)

  // --- Ungespeicherte Eingaben an die App melden ---
  const melde = useFormularWaechter()
  const startAbbild = useRef(
    JSON.stringify([start.formular, start.mengeText, start.geoeffnet, start.geoeffnetDatum]),
  )
  const geaendert =
    JSON.stringify([formular, mengeText, geoeffnet, geoeffnetDatum]) !== startAbbild.current
  useEffect(() => {
    melde(geaendert)
  }, [geaendert, melde])
  useEffect(() => () => melde(false), [melde])

  const zeigeOeffnen = kannGeoeffnetWerden(formular.kategorie, formular.lagerort)
  const kategorieInfo = istKategorie(formular.kategorie)
    ? KATEGORIE_INFO[formular.kategorie]
    : undefined

  function mengeAlsZahl(): number {
    return parseMenge(mengeText)
  }

  // Eine angezeigte Fehlermeldung verschwindet, sobald das Feld geändert wird.
  function loescheFehler(feld: keyof Fehler) {
    setFehler((alt) => (alt[feld] ? { ...alt, [feld]: undefined } : alt))
  }

  // Beim Tippen des Namens: Kategorie vorschlagen (solange nicht selbst gewählt)
  function aendereName(name: string) {
    let kategorie = formular.kategorie
    if (!kategorieManuell) {
      const vorschlag = erkenneKategorie(name)
      kategorie = vorschlag ?? ''
      setKategorieVorgeschlagen(Boolean(vorschlag))
    }
    setFormular({ ...formular, name, kategorie })
    loescheFehler('name')
    if (kategorie !== '') loescheFehler('kategorie')
  }

  function aendereKategorie(kategorie: string) {
    setKategorieManuell(true)
    setKategorieVorgeschlagen(false)
    setFormular({ ...formular, kategorie })
    loescheFehler('kategorie')
  }

  function aendereGeoeffnet(an: boolean) {
    setGeoeffnet(an)
    if (an && geoeffnetDatum === '') setGeoeffnetDatum(heuteAlsString())
  }

  // Schnellauswahl: füllt alle Felder mit den Werten einer Vorlage
  function wendeVorlageAn(index: number) {
    const daten = vorlageZuFormDaten(VORLAGEN[index])
    setFormular(daten)
    setMengeText(formatiereMenge(daten.menge))
    setGeoeffnet(false)
    setKategorieManuell(true)
    setKategorieVorgeschlagen(false)
    setFehler({})
  }

  function pruefeFormular(): Fehler {
    const neueFehler: Fehler = {}

    if (formular.name.trim() === '') {
      neueFehler.name = 'Bitte gib einen Namen ein.'
    }
    if (!(mengeAlsZahl() > 0) || !Number.isFinite(mengeAlsZahl())) {
      neueFehler.menge = 'Bitte eine Zahl größer als 0 eingeben (z. B. 1,5).'
    }
    if (!istKategorie(formular.kategorie)) {
      neueFehler.kategorie = 'Bitte wähle eine Kategorie.'
    }
    if (formular.datum.trim() === '') {
      neueFehler.datum = 'Bitte wähle ein Datum aus.'
    } else if (!istGueltigesDatum(formular.datum)) {
      neueFehler.datum = 'Bitte ein gültiges Datum eingeben.'
    }
    if (zeigeOeffnen && geoeffnet) {
      if (!istGueltigesDatum(geoeffnetDatum) || geoeffnetDatum > heuteAlsString()) {
        neueFehler.geoeffnetAm = 'Bitte ein gültiges Datum eingeben (nicht in der Zukunft).'
      }
    }

    return neueFehler
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const neueFehler = pruefeFormular()
    setFehler(neueFehler)

    if (Object.keys(neueFehler).length === 0) {
      onSpeichern({
        ...formular,
        name: formular.name.trim(),
        menge: mengeAlsZahl(),
        einheit: formular.einheit.trim() || 'Stück',
        notiz: formular.notiz?.trim() ?? '',
        geoeffnetAm: zeigeOeffnen && geoeffnet ? geoeffnetDatum : undefined,
      })
    }
  }

  return (
    <form className="formular" onSubmit={handleSubmit} noValidate>
      {!bestehendesLebensmittel && (
        <div className="formular__feld">
          <span className="formular__label">Schnellauswahl</span>
          <div className="chips">
            {VORLAGEN.map((v, index) => (
              <button
                key={v.name}
                type="button"
                className="chip"
                onClick={() => wendeVorlageAn(index)}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="formular__feld">
        <label htmlFor="name">Name *</label>
        <input
          id="name"
          type="text"
          value={formular.name}
          onChange={(e) => aendereName(e.target.value)}
          placeholder="z. B. Vollmilch"
        />
        {fehler.name && <p className="formular__fehler">{fehler.name}</p>}
      </div>

      <div className="formular__reihe">
        <div className="formular__feld">
          <label htmlFor="menge">Menge *</label>
          <input
            id="menge"
            type="text"
            inputMode="decimal"
            value={mengeText}
            onChange={(e) => {
              setMengeText(e.target.value)
              loescheFehler('menge')
            }}
          />
          {fehler.menge && <p className="formular__fehler">{fehler.menge}</p>}
        </div>

        <div className="formular__feld">
          <label htmlFor="einheit">Einheit</label>
          <input
            id="einheit"
            type="text"
            list="einheiten-vorschlaege"
            value={formular.einheit}
            onChange={(e) => setFormular({ ...formular, einheit: e.target.value })}
            placeholder="z. B. g, kg, Stück, Liter"
          />
        </div>
      </div>

      <datalist id="einheiten-vorschlaege">
        {['Stück', 'g', 'kg', 'ml', 'Liter', 'Packung', 'Dose', 'Flasche'].map((e) => (
          <option key={e} value={e} />
        ))}
      </datalist>

      <div className="formular__feld">
        <label htmlFor="kategorie">Kategorie *</label>
        <select
          id="kategorie"
          value={formular.kategorie}
          onChange={(e) => aendereKategorie(e.target.value)}
        >
          <option value="">Bitte wählen …</option>
          {KATEGORIEN.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        {kategorieVorgeschlagen && !fehler.kategorie && (
          <p className="formular__hinweis">Vorschlag aus dem Namen – bitte prüfen.</p>
        )}
        {fehler.kategorie && <p className="formular__fehler">{fehler.kategorie}</p>}
      </div>

      <div className="formular__feld">
        <label htmlFor="lagerort">Lagerort</label>
        <select
          id="lagerort"
          value={formular.lagerort}
          onChange={(e) =>
            setFormular({ ...formular, lagerort: e.target.value as Lagerort })
          }
        >
          <option value="Kühlschrank">Kühlschrank</option>
          <option value="Gefrierfach">Gefrierfach</option>
          <option value="Vorratsschrank">Vorratsschrank</option>
        </select>
      </div>

      <div className="formular__reihe">
        <div className="formular__feld">
          <label htmlFor="datumsart">Datumsart</label>
          <select
            id="datumsart"
            value={formular.datumsart}
            onChange={(e) =>
              setFormular({ ...formular, datumsart: e.target.value as Datumsart })
            }
          >
            <option value="MHD">MHD</option>
            <option value="Verbrauchsdatum">Verbrauchsdatum</option>
          </select>
        </div>

        <div className="formular__feld">
          <label htmlFor="datum">Datum *</label>
          <input
            id="datum"
            type="date"
            value={formular.datum}
            onChange={(e) => {
              setFormular({ ...formular, datum: e.target.value })
              loescheFehler('datum')
            }}
          />
          {fehler.datum && <p className="formular__fehler">{fehler.datum}</p>}
        </div>
      </div>

      <HinweisBox text={hinweisFuerDatumsart(formular.datumsart)} />

      {zeigeOeffnen && kategorieInfo && kategorieInfo.offenTage !== null && (
        <div className="formular__feld formular__oeffnen">
          <label className="formular__checkbox" htmlFor="geoeffnet">
            <input
              id="geoeffnet"
              type="checkbox"
              checked={geoeffnet}
              onChange={(e) => aendereGeoeffnet(e.target.checked)}
            />
            Bereits geöffnet bzw. angeschnitten
          </label>
          {geoeffnet && (
            <>
              <label htmlFor="geoeffnet-am">Geöffnet am</label>
              <input
                id="geoeffnet-am"
                type="date"
                max={heuteAlsString()}
                value={geoeffnetDatum}
                onChange={(e) => {
                  setGeoeffnetDatum(e.target.value)
                  loescheFehler('geoeffnetAm')
                }}
              />
              {fehler.geoeffnetAm && <p className="formular__fehler">{fehler.geoeffnetAm}</p>}
              <p className="formular__hinweis">
                Geöffnete Ware hält kürzer: Bei {kategorieInfo.bezeichnung} empfehlen wir den
                Verbrauch innerhalb von {tageDativ(kategorieInfo.offenTage)} (Richtwert).
              </p>
            </>
          )}
        </div>
      )}

      <div className="formular__feld">
        <label htmlFor="notiz">Notiz (optional)</label>
        <textarea
          id="notiz"
          value={formular.notiz}
          onChange={(e) => setFormular({ ...formular, notiz: e.target.value })}
          placeholder="z. B. hinten im Kühlschrank"
        />
      </div>

      <div className="formular__aktionen">
        <Button type="button" variante="sekundaer" onClick={onAbbrechen}>
          Abbrechen
        </Button>
        <Button type="submit" variante="primaer">
          Speichern
        </Button>
      </div>

      {onLoeschen && (
        <div className="formular__loeschen">
          <Button type="button" variante="gefahr" onClick={onLoeschen}>
            Eintrag löschen
          </Button>
        </div>
      )}
    </form>
  )
}

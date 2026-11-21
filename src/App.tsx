// Hauptkomponente der App. Steuert die einfache Navigation
// zwischen den "Seiten" (Heute, Lebensmittel, Hinzufügen, Einkauf, Archiv).
// Es wird bewusst KEIN Router verwendet, um den Prototyp einfach zu halten.
//
// Außerdem hier:
// - Rückgängig: Änderungen merken sich den Zustand davor (Toast mit "Rückgängig").
// - Wächter: Wer mit ungespeicherten Eingaben die Seite wechselt, wird gewarnt.

import { useEffect, useState } from 'react'
import type {
  ArchivGrund,
  Einkaufsposten,
  Lebensmittel,
  LebensmittelFormDaten,
} from './types/food'
import { useLebensmittel } from './hooks/useLebensmittel'
import { useEinkaufsliste } from './hooks/useEinkaufsliste'
import { useFarbschema } from './hooks/useFarbschema'
import { FormularWaechterContext } from './hooks/useFormularWaechter'
import { berechneStatus, vergleicheDringlichkeit } from './utils/status'
import { erkenneKategorie } from './utils/kategorien'
import { Dashboard } from './pages/Dashboard'
import { LebensmittelHinzufuegen } from './pages/LebensmittelHinzufuegen'
import { Uebersicht } from './pages/Uebersicht'
import { Einkaufsliste } from './pages/Einkaufsliste'
import { Archiv } from './pages/Archiv'
import { BestaetigungsDialog } from './components/BestaetigungsDialog'
import { ErinnerungsDialog } from './components/ErinnerungsDialog'

type Seite = 'dashboard' | 'uebersicht' | 'hinzufuegen' | 'einkauf' | 'archiv'

const NAVIGATION: { seite: Seite; label: string }[] = [
  { seite: 'dashboard', label: 'Heute' },
  { seite: 'uebersicht', label: 'Lebensmittel' },
  { seite: 'hinzufuegen', label: 'Hinzufügen' },
  { seite: 'einkauf', label: 'Einkauf' },
  { seite: 'archiv', label: 'Archiv' },
]

const ERINNERUNG_KEY = 'freshtrack_erinnerung_gezeigt'

// Kurze Rückmeldung unten; mit "rueckgaengig" erscheint ein Rückgängig-Knopf.
interface Toast {
  text: string
  rueckgaengig?: () => void
}

type AppDialog = 'reset' | 'einkaufLeeren' | 'verwerfen' | null

// "„Milch“" bei einem Eintrag, "3 Lebensmittel" bei mehreren
function beschreibung(namen: string[]): string {
  return namen.length === 1 ? `„${namen[0]}“` : `${namen.length} Lebensmittel`
}

function App() {
  const [aktiveSeite, setSeite] = useState<Seite>('dashboard')
  // Vorausgefüllte Werte für "Hinzufügen" (kommt von der Einkaufsliste)
  const [startwerte, setStartwerte] = useState<Partial<LebensmittelFormDaten> | undefined>()
  const [einkaufId, setEinkaufId] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const [erinnerungOffen, setErinnerungOffen] = useState(false)
  const [appDialog, setAppDialog] = useState<AppDialog>(null)
  const [formularGeaendert, setFormularGeaendert] = useState(false)
  const [wartendeSeite, setWartendeSeite] = useState<Seite | null>(null)

  const lm = useLebensmittel()
  const einkauf = useEinkaufsliste()
  const { schema, umschalten } = useFarbschema()

  const aktiveLebensmittel = lm.liste.filter((e) => !e.verbraucht)
  const archivierteLebensmittel = lm.liste.filter((e) => e.verbraucht)
  const dringende = aktiveLebensmittel
    .filter((e) => {
      const status = berechneStatus(e)
      return status === 'Zeitnah verwenden oder prüfen' || status === 'Entsorgung empfohlen'
    })
    .sort(vergleicheDringlichkeit)

  // Beim Start: einmal pro Browser-Sitzung an dringende Lebensmittel erinnern.
  useEffect(() => {
    if (!lm.istGeladen) return
    try {
      if (sessionStorage.getItem(ERINNERUNG_KEY)) return
      sessionStorage.setItem(ERINNERUNG_KEY, '1')
    } catch {
      /* ohne sessionStorage erscheint die Erinnerung eben bei jedem Laden */
    }
    if (dringende.length > 0) setErinnerungOffen(true)
    // bewusst nur beim ersten Laden
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lm.istGeladen])

  // Toast verschwindet nach ein paar Sekunden (mit Rückgängig etwas länger).
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), toast.rueckgaengig ? 7000 : 3000)
    return () => clearTimeout(timer)
  }, [toast])

  // Browser-Warnung beim Schließen/Neuladen mit ungespeicherten Eingaben.
  useEffect(() => {
    if (!formularGeaendert) return
    function beimVerlassen(e: BeforeUnloadEvent) {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', beimVerlassen)
    return () => window.removeEventListener('beforeunload', beimVerlassen)
  }, [formularGeaendert])

  if (!lm.istGeladen) {
    return <p className="app__laedt">Lade Daten...</p>
  }

  // ---------- Navigation ----------

  // Wechselt direkt (ohne Rückfrage) die Seite, z. B. nach dem Speichern.
  function geheZu(seite: Seite) {
    // Manuelle Navigation verwirft eine angefangene Übernahme von der Einkaufsliste.
    setStartwerte(undefined)
    setEinkaufId(null)
    setSeite(seite)
    window.scrollTo(0, 0)
  }

  // Wechsel über die Navigationsleiste: warnt bei ungespeicherten Eingaben.
  function navigiere(seite: Seite) {
    if (seite === aktiveSeite) {
      window.scrollTo(0, 0)
      return
    }
    if (formularGeaendert) {
      setWartendeSeite(seite)
      setAppDialog('verwerfen')
      return
    }
    geheZu(seite)
  }

  // ---------- Änderungen mit Rückgängig ----------

  function abschliessen(ids: string[], grund: ArchivGrund) {
    const vorher = lm.liste
    const namen = lm.liste.filter((e) => ids.includes(e.id)).map((e) => e.name)
    if (namen.length === 0) return
    lm.lebensmittelAbschliessen(ids, grund)
    setToast({
      text: `${beschreibung(namen)} als ${grund === 'verbraucht' ? 'verbraucht' : 'weggeworfen'} markiert.`,
      rueckgaengig: () => lm.listeSetzen(vorher),
    })
  }

  function mengeAendern(id: string, menge: number) {
    const vorher = lm.liste
    const eintrag = lm.liste.find((e) => e.id === id)
    if (!eintrag) return
    lm.lebensmittelMengeAendern(id, menge)
    setToast({
      text:
        menge <= 0
          ? `„${eintrag.name}“ ist verbraucht und liegt im Archiv.`
          : `Restmenge von „${eintrag.name}“ angepasst.`,
      rueckgaengig: () => lm.listeSetzen(vorher),
    })
  }

  function loeschen(ids: string[]) {
    const vorher = lm.liste
    const namen = lm.liste.filter((e) => ids.includes(e.id)).map((e) => e.name)
    if (namen.length === 0) return
    lm.lebensmittelLoeschen(ids)
    setToast({
      text: `${beschreibung(namen)} gelöscht.`,
      rueckgaengig: () => lm.listeSetzen(vorher),
    })
  }

  function archivLeeren() {
    const vorher = lm.liste
    lm.archivLeeren()
    setToast({ text: 'Archiv geleert.', rueckgaengig: () => lm.listeSetzen(vorher) })
  }

  function wiederherstellen(id: string) {
    const vorher = lm.liste
    const eintrag = lm.liste.find((e) => e.id === id)
    lm.lebensmittelWiederherstellen(id)
    if (eintrag) {
      setToast({
        text: `„${eintrag.name}“ ist wieder im Vorrat.`,
        rueckgaengig: () => lm.listeSetzen(vorher),
      })
    }
  }

  function bearbeiten(id: string, daten: LebensmittelFormDaten) {
    lm.lebensmittelBearbeiten(id, daten)
    setToast({ text: `„${daten.name}“ wurde gespeichert.` })
  }

  function einkaufEntfernen(id: string) {
    const vorher = einkauf.posten
    const posten = vorher.find((p) => p.id === id)
    einkauf.entfernen(id)
    if (posten) {
      setToast({
        text: `„${posten.name}“ von der Einkaufsliste entfernt.`,
        rueckgaengig: () => einkauf.setzen(vorher),
      })
    }
  }

  // ---------- Einkaufsliste <-> Vorrat ----------

  function inVorratUebernehmen(posten: Einkaufsposten) {
    setStartwerte({
      name: posten.name,
      menge: posten.menge,
      einheit: posten.einheit,
      kategorie: posten.kategorie,
      lagerort: posten.lagerort,
    })
    setEinkaufId(posten.id)
    setSeite('hinzufuegen')
    window.scrollTo(0, 0)
  }

  function nochmalKaufen(e: Lebensmittel) {
    const neu = einkauf.hinzufuegen({
      name: e.name,
      menge: e.menge,
      einheit: e.einheit,
      kategorie: e.kategorie,
      lagerort: e.lagerort,
    })
    setToast({
      text: neu
        ? `„${e.name}“ steht jetzt auf der Einkaufsliste.`
        : `„${e.name}“ steht schon auf der Einkaufsliste.`,
    })
  }

  function speichereNeues(daten: LebensmittelFormDaten) {
    lm.lebensmittelHinzufuegen(daten)
    if (einkaufId) einkauf.entfernen(einkaufId)
    setToast({ text: `„${daten.name}“ wurde hinzugefügt.` })
    geheZu('uebersicht')
  }

  // ---------- App-Dialoge ----------

  function bestaetigeAppDialog() {
    if (appDialog === 'reset') {
      lm.beispieldatenLaden()
      einkauf.beispieleLaden()
      setToast({ text: 'Beispieldaten wurden geladen.' })
      geheZu('dashboard')
    } else if (appDialog === 'einkaufLeeren') {
      const vorher = einkauf.posten
      einkauf.leeren()
      setToast({ text: 'Einkaufsliste geleert.', rueckgaengig: () => einkauf.setzen(vorher) })
    } else if (appDialog === 'verwerfen' && wartendeSeite) {
      setFormularGeaendert(false)
      geheZu(wartendeSeite)
    }
    setWartendeSeite(null)
    setAppDialog(null)
  }

  function schliesseAppDialog() {
    setWartendeSeite(null)
    setAppDialog(null)
  }

  const dialogTexte = {
    reset: {
      titel: 'Beispieldaten laden?',
      text: 'Alle Lebensmittel, das Archiv und die Einkaufsliste werden durch frische Beispieldaten ersetzt.',
      bestaetigen: 'Zurücksetzen',
      abbrechen: 'Abbrechen',
    },
    einkaufLeeren: {
      titel: 'Einkaufsliste leeren?',
      text: 'Alle Einträge auf der Einkaufsliste werden entfernt.',
      bestaetigen: 'Leeren',
      abbrechen: 'Abbrechen',
    },
    verwerfen: {
      titel: 'Eingaben verwerfen?',
      text: 'Deine Eingaben sind noch nicht gespeichert und gehen verloren.',
      bestaetigen: 'Verwerfen',
      abbrechen: 'Weiter bearbeiten',
    },
  }

  return (
    <FormularWaechterContext.Provider value={setFormularGeaendert}>
      <div className="app">
        <header className="app__kopf">
          <div className="app__titelblock">
            <h1 className="app__logo">FreshTrack</h1>
            <p className="app__slogan">Weniger wegwerfen. Weniger doppelt kaufen.</p>
          </div>
          <button
            type="button"
            className="theme-btn"
            onClick={umschalten}
            aria-label={schema === 'hell' ? 'Dunkles Design aktivieren' : 'Helles Design aktivieren'}
          >
            {schema === 'hell' ? 'Dunkel' : 'Hell'}
          </button>
        </header>

        {lm.speicherFehler && (
          <p className="speicherfehler" role="alert">
            Achtung: Änderungen konnten nicht im Browser gespeichert werden und gehen beim
            Neuladen verloren.
          </p>
        )}

        <main className="app__inhalt">
          {aktiveSeite === 'dashboard' && (
            <Dashboard
              aktiveLebensmittel={aktiveLebensmittel}
              archivierteLebensmittel={archivierteLebensmittel}
              onLebensmittelHinzufuegen={() => geheZu('hinzufuegen')}
              onAlleAnzeigen={() => geheZu('uebersicht')}
            />
          )}

          {aktiveSeite === 'hinzufuegen' && (
            <LebensmittelHinzufuegen
              // key: setzt das Formular zurück, wenn andere Startwerte kommen
              key={einkaufId ?? 'neu'}
              startwerte={startwerte}
              onSpeichern={speichereNeues}
              onAbbrechen={() => geheZu(einkaufId ? 'einkauf' : 'dashboard')}
            />
          )}

          {aktiveSeite === 'uebersicht' && (
            <Uebersicht
              aktiveLebensmittel={aktiveLebensmittel}
              onBearbeiten={bearbeiten}
              onAbschliessen={abschliessen}
              onMengeAendern={mengeAendern}
              onLoeschen={loeschen}
            />
          )}

          {aktiveSeite === 'einkauf' && (
            <Einkaufsliste
              posten={einkauf.posten}
              onHinzufuegen={(name) =>
                einkauf.hinzufuegen({
                  name,
                  menge: 1,
                  einheit: 'Stück',
                  // Vorschlag aus dem Namen; sonst wird die Kategorie beim Übernehmen gewählt
                  kategorie: erkenneKategorie(name) ?? '',
                  lagerort: 'Kühlschrank',
                })
              }
              onInVorrat={inVorratUebernehmen}
              onEntfernen={einkaufEntfernen}
              onLeeren={() => setAppDialog('einkaufLeeren')}
            />
          )}

          {aktiveSeite === 'archiv' && (
            <Archiv
              archivierteLebensmittel={archivierteLebensmittel}
              onWiederherstellen={wiederherstellen}
              onNochmalKaufen={nochmalKaufen}
              onLoeschen={loeschen}
              onArchivLeeren={archivLeeren}
            />
          )}

          <footer className="app__fuss">
            <button type="button" className="linkbutton" onClick={() => setAppDialog('reset')}>
              Beispieldaten zurücksetzen
            </button>
          </footer>
        </main>

        {toast && (
          <div className="toast" role="status">
            <span className="toast__text">{toast.text}</span>
            {toast.rueckgaengig && (
              <button
                type="button"
                className="toast__aktion"
                onClick={() => {
                  toast.rueckgaengig?.()
                  setToast({ text: 'Rückgängig gemacht.' })
                }}
              >
                Rückgängig
              </button>
            )}
          </div>
        )}

        <nav className="app__navigation" aria-label="Hauptnavigation">
          {NAVIGATION.map(({ seite, label }) => (
            <button
              key={seite}
              aria-current={aktiveSeite === seite ? 'page' : undefined}
              className={aktiveSeite === seite ? 'nav-btn nav-btn--aktiv' : 'nav-btn'}
              onClick={() => navigiere(seite)}
            >
              {label}
            </button>
          ))}
        </nav>

        {erinnerungOffen && (
          <ErinnerungsDialog
            lebensmittel={dringende}
            onSchliessen={() => setErinnerungOffen(false)}
            onAnzeigen={() => {
              setErinnerungOffen(false)
              geheZu('uebersicht')
            }}
          />
        )}

        {appDialog && (
          <BestaetigungsDialog
            titel={dialogTexte[appDialog].titel}
            text={dialogTexte[appDialog].text}
            bestaetigenText={dialogTexte[appDialog].bestaetigen}
            abbrechenText={dialogTexte[appDialog].abbrechen}
            gefahr
            onBestaetigen={bestaetigeAppDialog}
            onAbbrechen={schliesseAppDialog}
          />
        )}
      </div>
    </FormularWaechterContext.Provider>
  )
}

export default App

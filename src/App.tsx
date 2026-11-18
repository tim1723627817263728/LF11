// Hauptkomponente der App. Steuert die einfache Navigation
// zwischen den "Seiten" (Heute, Lebensmittel, Hinzufügen, Einkauf, Archiv).
// Es wird bewusst KEIN Router verwendet, um den Prototyp einfach zu halten.

import { useEffect, useState } from 'react'
import type { LebensmittelFormDaten, Einkaufsposten, Lebensmittel } from './types/food'
import { useLebensmittel } from './hooks/useLebensmittel'
import { useEinkaufsliste } from './hooks/useEinkaufsliste'
import { useFarbschema } from './hooks/useFarbschema'
import { berechneStatus, vergleicheDringlichkeit } from './utils/status'
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

function App() {
  const [aktiveSeite, setSeite] = useState<Seite>('dashboard')
  // Vorausgefüllte Werte für "Hinzufügen" (kommt von der Einkaufsliste)
  const [startwerte, setStartwerte] = useState<Partial<LebensmittelFormDaten> | undefined>()
  const [einkaufId, setEinkaufId] = useState<string | null>(null)
  const [meldung, setMeldung] = useState('')
  const [erinnerungOffen, setErinnerungOffen] = useState(false)
  const [appDialog, setAppDialog] = useState<'reset' | 'einkaufLeeren' | null>(null)

  const lm = useLebensmittel()
  const einkauf = useEinkaufsliste()
  const { schema, umschalten } = useFarbschema()

  const aktiveLebensmittel = lm.liste.filter((e) => !e.verbraucht)
  const archivierteLebensmittel = lm.liste.filter((e) => e.verbraucht)
  const dringende = aktiveLebensmittel
    .filter((e) => berechneStatus(e) === 'Zeitnah verwenden oder prüfen')
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

  // Kurze Rückmeldung (Toast), verschwindet nach ein paar Sekunden.
  useEffect(() => {
    if (!meldung) return
    const timer = setTimeout(() => setMeldung(''), 3000)
    return () => clearTimeout(timer)
  }, [meldung])

  if (!lm.istGeladen) {
    return <p className="app__laedt">Lade Daten...</p>
  }

  function geheZu(seite: Seite) {
    // Manuelle Navigation verwirft eine angefangene Übernahme von der Einkaufsliste.
    setStartwerte(undefined)
    setEinkaufId(null)
    setSeite(seite)
    window.scrollTo(0, 0)
  }

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
    setMeldung(
      neu
        ? `„${e.name}“ steht jetzt auf der Einkaufsliste.`
        : `„${e.name}“ steht schon auf der Einkaufsliste.`,
    )
  }

  function speichereNeues(daten: LebensmittelFormDaten) {
    lm.lebensmittelHinzufuegen(daten)
    if (einkaufId) einkauf.entfernen(einkaufId)
    setMeldung(`„${daten.name}“ wurde hinzugefügt.`)
    geheZu('uebersicht')
  }

  function bestaetigeAppDialog() {
    if (appDialog === 'reset') {
      lm.beispieldatenLaden()
      einkauf.beispieleLaden()
      setMeldung('Beispieldaten wurden geladen.')
      geheZu('dashboard')
    } else if (appDialog === 'einkaufLeeren') {
      einkauf.leeren()
    }
    setAppDialog(null)
  }

  return (
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
            onBearbeiten={lm.lebensmittelBearbeiten}
            onAbschliessen={lm.lebensmittelAbschliessen}
            onMengeAendern={lm.lebensmittelMengeAendern}
            onLoeschen={lm.lebensmittelLoeschen}
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
                kategorie: '',
                lagerort: 'Kühlschrank',
              })
            }
            onInVorrat={inVorratUebernehmen}
            onEntfernen={einkauf.entfernen}
            onLeeren={() => setAppDialog('einkaufLeeren')}
          />
        )}

        {aktiveSeite === 'archiv' && (
          <Archiv
            archivierteLebensmittel={archivierteLebensmittel}
            onWiederherstellen={lm.lebensmittelWiederherstellen}
            onNochmalKaufen={nochmalKaufen}
            onLoeschen={lm.lebensmittelLoeschen}
            onArchivLeeren={lm.archivLeeren}
          />
        )}

        <footer className="app__fuss">
          <button type="button" className="linkbutton" onClick={() => setAppDialog('reset')}>
            Beispieldaten zurücksetzen
          </button>
        </footer>
      </main>

      {meldung && (
        <p className="toast" role="status">
          {meldung}
        </p>
      )}

      <nav className="app__navigation" aria-label="Hauptnavigation">
        {NAVIGATION.map(({ seite, label }) => (
          <button
            key={seite}
            aria-current={aktiveSeite === seite ? 'page' : undefined}
            className={aktiveSeite === seite ? 'nav-btn nav-btn--aktiv' : 'nav-btn'}
            onClick={() => geheZu(seite)}
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
          titel={appDialog === 'reset' ? 'Beispieldaten laden?' : 'Einkaufsliste leeren?'}
          text={
            appDialog === 'reset'
              ? 'Alle Lebensmittel, das Archiv und die Einkaufsliste werden durch frische Beispieldaten ersetzt.'
              : 'Alle Einträge auf der Einkaufsliste werden entfernt.'
          }
          bestaetigenText={appDialog === 'reset' ? 'Zurücksetzen' : 'Leeren'}
          gefahr
          onBestaetigen={bestaetigeAppDialog}
          onAbbrechen={() => setAppDialog(null)}
        />
      )}
    </div>
  )
}

export default App

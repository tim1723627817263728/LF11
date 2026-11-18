// Diese Datei kapselt den Zugriff auf den localStorage.
// So greift der Rest der App nie direkt auf localStorage zu.

import type { Einkaufsposten, Lebensmittel } from '../types/food'
import { istGueltigesDatum } from './datum'

const STORAGE_KEY = 'freshtrack_lebensmittel'
// Merkt sich, dass die Beispieldaten schon einmal angelegt wurden.
// Sonst kämen sie zurück, sobald der Nutzer alle Einträge gelöscht hat.
const INIT_KEY = 'freshtrack_initialisiert'
const EINKAUF_KEY = 'freshtrack_einkaufsliste'
const THEME_KEY = 'freshtrack_theme'

const LAGERORTE = ['Kühlschrank', 'Gefrierfach', 'Vorratsschrank']
const DATUMSARTEN = ['MHD', 'Verbrauchsdatum']

// Prüft einen einzelnen geladenen Eintrag. Beschädigte Einträge werden
// verworfen, damit sie die Oberfläche nicht zum Absturz bringen.
function istGueltigerEintrag(e: unknown): e is Lebensmittel {
  if (typeof e !== 'object' || e === null) return false
  const x = e as Record<string, unknown>
  return (
    typeof x.id === 'string' &&
    typeof x.name === 'string' &&
    typeof x.menge === 'number' &&
    Number.isFinite(x.menge) &&
    typeof x.einheit === 'string' &&
    typeof x.kategorie === 'string' &&
    typeof x.lagerort === 'string' &&
    LAGERORTE.includes(x.lagerort) &&
    typeof x.datumsart === 'string' &&
    DATUMSARTEN.includes(x.datumsart) &&
    typeof x.datum === 'string' &&
    istGueltigesDatum(x.datum) &&
    typeof x.verbraucht === 'boolean'
  )
}

export function ladeLebensmittel(): Lebensmittel[] {
  try {
    const rohdaten = localStorage.getItem(STORAGE_KEY)
    if (!rohdaten) return []
    const daten: unknown = JSON.parse(rohdaten)
    if (!Array.isArray(daten)) return []
    return daten.filter(istGueltigerEintrag).map((e) => ({
      ...e,
      archivGrund: e.archivGrund === 'weggeworfen' ? ('weggeworfen' as const) : e.archivGrund === 'verbraucht' ? ('verbraucht' as const) : undefined,
      erstelltAm: typeof e.erstelltAm === 'string' ? e.erstelltAm : new Date().toISOString(),
    }))
  } catch (fehler) {
    console.error('Fehler beim Laden aus localStorage:', fehler)
    return []
  }
}

// Gibt true zurück, wenn das Speichern geklappt hat, sonst false
// (z. B. Speicher voll oder im privaten Modus gesperrt).
export function speichereLebensmittel(liste: Lebensmittel[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(liste))
    return true
  } catch (fehler) {
    console.error('Fehler beim Speichern in localStorage:', fehler)
    return false
  }
}

export function warBereitsInitialisiert(): boolean {
  try {
    return localStorage.getItem(INIT_KEY) === '1'
  } catch {
    return false
  }
}

export function markiereAlsInitialisiert(): void {
  try {
    localStorage.setItem(INIT_KEY, '1')
  } catch {
    /* nicht kritisch */
  }
}

// ---------- Einkaufsliste ----------

function istGueltigerPosten(e: unknown): e is Einkaufsposten {
  if (typeof e !== 'object' || e === null) return false
  const x = e as Record<string, unknown>
  return (
    typeof x.id === 'string' &&
    typeof x.name === 'string' &&
    x.name.trim() !== '' &&
    typeof x.menge === 'number' &&
    Number.isFinite(x.menge) &&
    typeof x.einheit === 'string' &&
    typeof x.kategorie === 'string' &&
    typeof x.lagerort === 'string' &&
    LAGERORTE.includes(x.lagerort)
  )
}

// Gibt null zurück, wenn noch nie etwas gespeichert wurde (-> Beispiele möglich).
export function ladeEinkaufsliste(): Einkaufsposten[] | null {
  try {
    const rohdaten = localStorage.getItem(EINKAUF_KEY)
    if (rohdaten === null) return null
    const daten: unknown = JSON.parse(rohdaten)
    return Array.isArray(daten) ? daten.filter(istGueltigerPosten) : []
  } catch (fehler) {
    console.error('Fehler beim Laden der Einkaufsliste:', fehler)
    return []
  }
}

export function speichereEinkaufsliste(liste: Einkaufsposten[]): boolean {
  try {
    localStorage.setItem(EINKAUF_KEY, JSON.stringify(liste))
    return true
  } catch (fehler) {
    console.error('Fehler beim Speichern der Einkaufsliste:', fehler)
    return false
  }
}

// ---------- Farbschema (hell/dunkel) ----------

export type Farbschema = 'hell' | 'dunkel'

export function ladeFarbschema(): Farbschema {
  try {
    const gespeichert = localStorage.getItem(THEME_KEY)
    if (gespeichert === 'hell' || gespeichert === 'dunkel') return gespeichert
  } catch {
    /* ignorieren, Systemeinstellung wird genutzt */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dunkel' : 'hell'
}

export function speichereFarbschema(schema: Farbschema): void {
  try {
    localStorage.setItem(THEME_KEY, schema)
  } catch {
    /* nicht kritisch */
  }
}

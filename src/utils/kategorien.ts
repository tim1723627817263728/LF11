// Feste Kategorien für Lebensmittel. Jede Kategorie hat Richtwerte für die
// Haltbarkeit (siehe haltbarkeit.ts). Weil die Auswahl fest ist, greifen die
// Regeln zuverlässig, ohne Tippfehler oder Duplikate wie "milch" und "Milch".

export const KATEGORIEN = [
  'Obst',
  'Gemüse',
  'Milchprodukte',
  'Eier',
  'Fleisch & Wurst',
  'Fisch',
  'Backwaren',
  'Fertiggerichte',
  'Getränke',
  'Konserven',
  'Trockenwaren',
  'Tiefkühlkost',
  'Sonstiges',
] as const

export type Kategorie = (typeof KATEGORIEN)[number]

export interface KategorieInfo {
  // Im Satz "Bei <bezeichnung> empfehlen wir ..." (Dativ).
  bezeichnung: string
  // So viele Tage darf das MHD überschritten sein, bevor entsorgt werden sollte.
  toleranzTage: number
  // So viele Tage ist geöffnete/angeschnittene Ware haltbar (Richtwert).
  // null = Öffnen spielt bei dieser Kategorie keine Rolle.
  offenTage: number | null
  // Nur für den Vorschlag aus dem Namen und für alte Daten (siehe erkenneKategorie).
  stichwoerter: string[]
  // Enthält der Text eins dieser Wörter, passt die Kategorie NICHT
  // (z. B. "Erdnussbutter" ist keine Butter im Sinne von Milchprodukten).
  ausnahmen?: string[]
}

export const KATEGORIE_INFO: Record<Kategorie, KategorieInfo> = {
  Obst: {
    bezeichnung: 'Obst',
    toleranzTage: 7,
    offenTage: 3,
    stichwoerter: ['obst', 'frucht', 'apfel', 'äpfel', 'banane', 'beere', 'orange', 'birne', 'trauben', 'zitrone', 'melone'],
  },
  Gemüse: {
    bezeichnung: 'Gemüse und Salat',
    toleranzTage: 7,
    offenTage: 3,
    stichwoerter: ['gemüse', 'salat', 'kräuter', 'karotte', 'möhre', 'tomate', 'gurke', 'paprika', 'zucchini', 'kartoffel', 'zwiebel'],
  },
  Milchprodukte: {
    bezeichnung: 'Milchprodukten',
    toleranzTage: 3,
    offenTage: 3,
    stichwoerter: ['milch', 'joghurt', 'jogurt', 'käse', 'quark', 'sahne', 'butter', 'skyr'],
    ausnahmen: ['kokos', 'hafer', 'soja', 'mandel', 'nuss', 'schoko', 'kakao', 'keks'],
  },
  Eier: {
    bezeichnung: 'Eiern',
    toleranzTage: 7,
    offenTage: null,
    stichwoerter: ['eier'],
    ausnahmen: ['nudel'],
  },
  'Fleisch & Wurst': {
    bezeichnung: 'Fleisch und Wurst',
    toleranzTage: 1,
    offenTage: 2,
    stichwoerter: ['fleisch', 'wurst', 'hack', 'geflügel', 'hähnchen', 'hühnchen', 'schinken', 'aufschnitt', 'salami', 'steak', 'schnitzel'],
  },
  Fisch: {
    bezeichnung: 'Fisch und Meeresfrüchten',
    toleranzTage: 0,
    offenTage: 1,
    stichwoerter: ['fisch', 'lachs', 'meeresfrüchte', 'garnele', 'thunfisch'],
  },
  Backwaren: {
    bezeichnung: 'Backwaren',
    toleranzTage: 5,
    offenTage: null,
    stichwoerter: ['backware', 'brot', 'brötchen', 'kuchen', 'toast', 'gebäck'],
    ausnahmen: ['aufstrich'],
  },
  Fertiggerichte: {
    bezeichnung: 'Fertiggerichten',
    toleranzTage: 2,
    offenTage: 2,
    stichwoerter: ['fertig', 'gericht', 'pizza', 'convenience'],
  },
  Getränke: {
    bezeichnung: 'Getränken',
    toleranzTage: 60,
    offenTage: 5,
    stichwoerter: ['getränk', 'saft', 'wasser', 'limo', 'cola'],
    ausnahmen: ['melone'],
  },
  Konserven: {
    bezeichnung: 'Konserven',
    toleranzTage: 180,
    offenTage: 3,
    stichwoerter: ['konserve', 'dose'],
  },
  Trockenwaren: {
    bezeichnung: 'Trockenwaren',
    toleranzTage: 180,
    offenTage: 90,
    stichwoerter: ['trocken', 'nudel', 'reis', 'mehl', 'müsli', 'gewürz', 'zucker', 'haferflocken', 'linsen', 'couscous', 'cornflakes'],
  },
  Tiefkühlkost: {
    bezeichnung: 'Tiefkühlkost',
    toleranzTage: 90,
    offenTage: null,
    stichwoerter: ['tiefkühl'],
  },
  Sonstiges: {
    bezeichnung: 'sonstigen Lebensmitteln',
    toleranzTage: 7,
    offenTage: null,
    stichwoerter: [],
  },
}

// In dieser Reihenfolge wird geprüft (die erste passende Kategorie gewinnt).
const ERKENNUNG: Kategorie[] = [
  'Tiefkühlkost',
  'Fertiggerichte',
  'Fleisch & Wurst',
  'Fisch',
  'Milchprodukte',
  'Eier',
  'Getränke',
  'Backwaren',
  'Obst',
  'Gemüse',
  'Konserven',
  'Trockenwaren',
]

export function istKategorie(wert: unknown): wert is Kategorie {
  return typeof wert === 'string' && (KATEGORIEN as readonly string[]).includes(wert)
}

// Rät die Kategorie aus einem Text (nur ein VORSCHLAG, nie ein Ergebnis,
// auf das man sich verlassen sollte). Gibt undefined zurück, wenn nichts passt.
export function erkenneKategorie(text: string): Kategorie | undefined {
  const klein = text.toLowerCase().trim()
  if (klein === '') return undefined
  return ERKENNUNG.find((kategorie) => {
    const info = KATEGORIE_INFO[kategorie]
    const passt = info.stichwoerter.some((wort) => klein.includes(wort))
    const ausgenommen = (info.ausnahmen ?? []).some((wort) => klein.includes(wort))
    return passt && !ausgenommen
  })
}

// Für alte Daten mit freier Kategorie: gültig lassen, sonst aus dem Kategorie-Text
// und danach aus dem Namen ableiten, zuletzt "Sonstiges".
export function normalisiereKategorie(kategorie: string, name: string): Kategorie {
  if (istKategorie(kategorie)) return kategorie
  return erkenneKategorie(kategorie) ?? erkenneKategorie(name) ?? 'Sonstiges'
}

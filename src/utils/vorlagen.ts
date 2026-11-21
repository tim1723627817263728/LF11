// Schnell-Vorlagen: häufige Produkte mit typischer Haltbarkeit.
// Ein Klick füllt das Formular vor, inklusive Datum (heute + Haltbarkeit).
// Die Haltbarkeiten sind grobe Richtwerte, die Verpackung hat Vorrang.

import type { LebensmittelFormDaten } from '../types/food'
import { datumInTagen } from './datum'
import type { Kategorie } from './kategorien'

interface Vorlage {
  name: string
  menge: number
  einheit: string
  kategorie: Kategorie
  lagerort: LebensmittelFormDaten['lagerort']
  datumsart: LebensmittelFormDaten['datumsart']
  haltbarkeitTage: number
}

export const VORLAGEN: Vorlage[] = [
  { name: 'Vollmilch', menge: 1, einheit: 'Liter', kategorie: 'Milchprodukte', lagerort: 'Kühlschrank', datumsart: 'MHD', haltbarkeitTage: 7 },
  { name: 'Eier', menge: 10, einheit: 'Stück', kategorie: 'Eier', lagerort: 'Kühlschrank', datumsart: 'MHD', haltbarkeitTage: 21 },
  { name: 'Brot', menge: 1, einheit: 'Stück', kategorie: 'Backwaren', lagerort: 'Vorratsschrank', datumsart: 'MHD', haltbarkeitTage: 4 },
  { name: 'Joghurt', menge: 4, einheit: 'Stück', kategorie: 'Milchprodukte', lagerort: 'Kühlschrank', datumsart: 'MHD', haltbarkeitTage: 10 },
  { name: 'Hackfleisch', menge: 500, einheit: 'g', kategorie: 'Fleisch & Wurst', lagerort: 'Kühlschrank', datumsart: 'Verbrauchsdatum', haltbarkeitTage: 1 },
  { name: 'Hähnchenbrust', menge: 500, einheit: 'g', kategorie: 'Fleisch & Wurst', lagerort: 'Kühlschrank', datumsart: 'Verbrauchsdatum', haltbarkeitTage: 2 },
  { name: 'Butter', menge: 250, einheit: 'g', kategorie: 'Milchprodukte', lagerort: 'Kühlschrank', datumsart: 'MHD', haltbarkeitTage: 30 },
  { name: 'Äpfel', menge: 1, einheit: 'kg', kategorie: 'Obst', lagerort: 'Kühlschrank', datumsart: 'MHD', haltbarkeitTage: 14 },
  { name: 'Salat', menge: 1, einheit: 'Stück', kategorie: 'Gemüse', lagerort: 'Kühlschrank', datumsart: 'MHD', haltbarkeitTage: 4 },
  { name: 'Nudeln', menge: 500, einheit: 'g', kategorie: 'Trockenwaren', lagerort: 'Vorratsschrank', datumsart: 'MHD', haltbarkeitTage: 365 },
]

// Wandelt eine Vorlage in Formularwerte um (mit berechnetem Datum).
export function vorlageZuFormDaten(v: Vorlage): LebensmittelFormDaten {
  return {
    name: v.name,
    menge: v.menge,
    einheit: v.einheit,
    kategorie: v.kategorie,
    lagerort: v.lagerort,
    datumsart: v.datumsart,
    datum: datumInTagen(v.haltbarkeitTage),
    notiz: '',
  }
}

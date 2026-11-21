// Auswertung des Archivs: Wie viel wurde verbraucht, wie viel weggeworfen?

import type { Lebensmittel } from '../types/food'
import { normalisiereKategorie } from './kategorien'

export interface Bilanz {
  verbraucht: number
  weggeworfen: number
  gesamt: number
  quote: number // Verbrauchsquote in Prozent (0-100), bei 0 Einträgen 0
  // Weggeworfene Lebensmittel je Kategorie, häufigste zuerst
  weggeworfenNachKategorie: { kategorie: string; anzahl: number }[]
}

export function berechneBilanz(archiv: Lebensmittel[]): Bilanz {
  const weggeworfen = archiv.filter((lm) => lm.archivGrund === 'weggeworfen').length
  const gesamt = archiv.length
  const verbraucht = gesamt - weggeworfen // alte Einträge ohne Grund zählen als verbraucht
  const zaehler = new Map<string, number>()
  for (const lm of archiv.filter((e) => e.archivGrund === 'weggeworfen')) {
    const kategorie = normalisiereKategorie(lm.kategorie, lm.name)
    zaehler.set(kategorie, (zaehler.get(kategorie) ?? 0) + 1)
  }
  const weggeworfenNachKategorie = [...zaehler.entries()]
    .map(([kategorie, anzahl]) => ({ kategorie, anzahl }))
    .sort((a, b) => b.anzahl - a.anzahl || a.kategorie.localeCompare(b.kategorie, 'de'))

  return {
    verbraucht,
    weggeworfen,
    gesamt,
    quote: gesamt === 0 ? 0 : Math.round((verbraucht / gesamt) * 100),
    weggeworfenNachKategorie,
  }
}

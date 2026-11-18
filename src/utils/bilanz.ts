// Auswertung des Archivs: Wie viel wurde verbraucht, wie viel weggeworfen?

import type { Lebensmittel } from '../types/food'

export interface Bilanz {
  verbraucht: number
  weggeworfen: number
  gesamt: number
  quote: number // Verbrauchsquote in Prozent (0-100), bei 0 Einträgen 0
}

export function berechneBilanz(archiv: Lebensmittel[]): Bilanz {
  const weggeworfen = archiv.filter((lm) => lm.archivGrund === 'weggeworfen').length
  const gesamt = archiv.length
  const verbraucht = gesamt - weggeworfen // alte Einträge ohne Grund zählen als verbraucht
  return {
    verbraucht,
    weggeworfen,
    gesamt,
    quote: gesamt === 0 ? 0 : Math.round((verbraucht / gesamt) * 100),
  }
}

// Feste Grenzen, ab wann ein abgelaufenes Lebensmittel nicht mehr
// "zeitnah verwendet", sondern die Entsorgung empfohlen wird.
//
// Pro Kategorie (siehe kategorien.ts) gibt es einen Richtwert in Tagen, wie lange
// das MHD überschritten sein darf ("Toleranz"). Die Werte sind bewusst vorsichtig
// gewählt und ersetzen keine Prüfung durch den Nutzer.
//
// Sonderfälle:
// - Verbrauchsdatum: Toleranz immer 0, nach Ablauf also sofort Entsorgung.
// - Gefrierfach: Tiefgekühltes verdirbt kaum, daher mindestens 90 Tage.
// - Geöffnet/angeschnitten: Ist die Haltbarkeit nach dem Öffnen kürzer als das MHD,
//   gilt diese frühere Frist, und danach wird sofort Entsorgung empfohlen.

import type { Lebensmittel } from '../types/food'
import { addiereTage, istGueltigesDatum, tageBis } from './datum'
import { KATEGORIE_INFO, normalisiereKategorie } from './kategorien'
import type { Kategorie } from './kategorien'

export const GEFRIERFACH_MINDEST_TOLERANZ = 90

type Pruefbar = Pick<
  Lebensmittel,
  'kategorie' | 'name' | 'lagerort' | 'datumsart' | 'datum' | 'geoeffnetAm'
>

export function kategorieVon(lm: Pick<Lebensmittel, 'kategorie' | 'name'>): Kategorie {
  return normalisiereKategorie(lm.kategorie, lm.name)
}

// Kann man bei dieser Kategorie/diesem Lagerort "geöffnet" angeben?
export function kannGeoeffnetWerden(kategorie: string, lagerort: Lebensmittel['lagerort']): boolean {
  if (lagerort === 'Gefrierfach') return false
  const kat = normalisiereKategorie(kategorie, '')
  return kategorie !== '' && KATEGORIE_INFO[kat].offenTage !== null
}

export interface Frist {
  datum: string // maßgebliches Datum (YYYY-MM-DD)
  quelle: 'aufdruck' | 'geoeffnet' // MHD/Verbrauchsdatum oder Richtwert nach dem Öffnen
}

// Das maßgebliche Datum: das aufgedruckte, oder (falls früher) das nach dem Öffnen.
export function berechneFrist(lm: Pruefbar): Frist {
  const offenTage = KATEGORIE_INFO[kategorieVon(lm)].offenTage
  if (
    lm.geoeffnetAm &&
    istGueltigesDatum(lm.geoeffnetAm) &&
    offenTage !== null &&
    lm.lagerort !== 'Gefrierfach'
  ) {
    const nachOeffnen = addiereTage(lm.geoeffnetAm, offenTage)
    if (nachOeffnen < lm.datum) {
      return { datum: nachOeffnen, quelle: 'geoeffnet' }
    }
  }
  return { datum: lm.datum, quelle: 'aufdruck' }
}

// Wie viele Tage darf die maßgebliche Frist überschritten sein?
export function toleranzTage(lm: Pruefbar): number {
  if (lm.datumsart === 'Verbrauchsdatum') return 0
  if (berechneFrist(lm).quelle === 'geoeffnet') return 0
  const toleranz = KATEGORIE_INFO[kategorieVon(lm)].toleranzTage
  return lm.lagerort === 'Gefrierfach' ? Math.max(toleranz, GEFRIERFACH_MINDEST_TOLERANZ) : toleranz
}

// true, wenn die Toleranz überschritten ist und die Entsorgung empfohlen wird.
export function sollEntsorgtWerden(lm: Pruefbar): boolean {
  const tage = tageBis(berechneFrist(lm).datum)
  if (Number.isNaN(tage)) return false
  return tage < -toleranzTage(lm)
}

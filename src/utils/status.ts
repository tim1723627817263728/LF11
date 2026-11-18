// Diese Datei berechnet den Status eines Lebensmittels
// anhand des gespeicherten Datums. Reine Funktionen, kein React.

import type { Datumsart, Lebensmittel, Status } from '../types/food'
import { tageBis } from './datum'

// Anzahl volle Tage zwischen heute und dem gegebenen Datum (negativ = abgelaufen).
export function tageBisDatum(datum: string): number {
  return tageBis(datum)
}

// Berechnet den Status eines Lebensmittels nach den Projekt-Regeln:
// > 5 Tage: Frisch
// 3 bis 5 Tage: Bald prüfen
// 0 bis 2 Tage (auch abgelaufen): Zeitnah verwenden oder prüfen
// Verbraucht überschreibt alles
export function berechneStatus(lebensmittel: Lebensmittel): Status {
  if (lebensmittel.verbraucht) {
    return lebensmittel.archivGrund === 'weggeworfen' ? 'Weggeworfen' : 'Verbraucht'
  }

  const tage = tageBisDatum(lebensmittel.datum)

  if (tage > 5) {
    return 'Frisch'
  }
  if (tage >= 3 && tage <= 5) {
    return 'Bald prüfen'
  }
  // Das deckt auch bereits abgelaufene Datumswerte ab (negative Tage)
  return 'Zeitnah verwenden oder prüfen'
}

// Liefert den passenden Sicherheits-Hinweistext je Datumsart.
// Wichtig: Die App behauptet NIE, dass etwas sicher essbar ist.
export function hinweisFuerDatumsart(datumsart: Datumsart): string {
  if (datumsart === 'MHD') {
    return 'MHD ist kein automatisches Wegwerfdatum. Prüfe Aussehen, Geruch und Verpackung.'
  }
  return 'Verbrauchsdatum beachten.'
}

// CSS-Klassenname passend zum Status, für die Farbgebung
export function statusKlasse(status: Status): string {
  switch (status) {
    case 'Frisch':
      return 'status status--frisch'
    case 'Bald prüfen':
      return 'status status--bald'
    case 'Zeitnah verwenden oder prüfen':
      return 'status status--zeitnah'
    case 'Verbraucht':
      return 'status status--verbraucht'
    case 'Weggeworfen':
      return 'status status--weggeworfen'
  }
}

// Sortierung nach Dringlichkeit: frühestes Datum zuerst.
// Bei gleichem Datum steht das Verbrauchsdatum (strenger) vor dem MHD,
// danach alphabetisch, damit die Reihenfolge immer gleich bleibt.
export function vergleicheDringlichkeit(a: Lebensmittel, b: Lebensmittel): number {
  if (a.datum !== b.datum) return a.datum.localeCompare(b.datum)
  if (a.datumsart !== b.datumsart) return a.datumsart === 'Verbrauchsdatum' ? -1 : 1
  return a.name.localeCompare(b.name, 'de')
}

// Lesbarer Text für die Restzeit, mit korrekter Einzahl/Mehrzahl.
export function restzeitText(tage: number): string {
  if (Number.isNaN(tage)) return ''
  if (tage === 0) return 'heute'
  if (tage === 1) return 'noch 1 Tag'
  if (tage > 1) return `noch ${tage} Tage`
  if (tage === -1) return 'seit 1 Tag abgelaufen'
  return `seit ${Math.abs(tage)} Tagen abgelaufen`
}

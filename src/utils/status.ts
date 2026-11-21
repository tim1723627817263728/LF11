// Diese Datei berechnet den Status eines Lebensmittels
// anhand des maßgeblichen Datums. Reine Funktionen, kein React.

import type { Datumsart, Lebensmittel, Status } from '../types/food'
import { formatiereDatum, tageBis } from './datum'
import { tageDativ } from './format'
import { berechneFrist, kategorieVon, sollEntsorgtWerden, toleranzTage } from './haltbarkeit'
import { KATEGORIE_INFO } from './kategorien'

// Anzahl volle Tage zwischen heute und dem gegebenen Datum (negativ = abgelaufen).
export function tageBisDatum(datum: string): number {
  return tageBis(datum)
}

// Wie oben, aber für die maßgebliche Frist (MHD oder verkürzte Frist nach dem Öffnen).
export function tageBisFrist(lm: Lebensmittel): number {
  return tageBis(berechneFrist(lm).datum)
}

// Berechnet den Status eines Lebensmittels nach den Projekt-Regeln:
// > 5 Tage: Frisch
// 3 bis 5 Tage: Bald prüfen
// 0 bis 2 Tage (oder knapp abgelaufen): Zeitnah verwenden oder prüfen
// Zu lange abgelaufen (je Kategorie, siehe haltbarkeit.ts): Entsorgung empfohlen
// Verbraucht/Weggeworfen überschreibt alles
export function berechneStatus(lebensmittel: Lebensmittel): Status {
  if (lebensmittel.verbraucht) {
    return lebensmittel.archivGrund === 'weggeworfen' ? 'Weggeworfen' : 'Verbraucht'
  }

  const tage = tageBisFrist(lebensmittel)

  if (sollEntsorgtWerden(lebensmittel)) {
    return 'Entsorgung empfohlen'
  }
  if (tage > 5) {
    return 'Frisch'
  }
  if (tage >= 3 && tage <= 5) {
    return 'Bald prüfen'
  }
  // Das deckt auch knapp abgelaufene Datumswerte ab (innerhalb der Toleranz)
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
    case 'Entsorgung empfohlen':
      return 'status status--entsorgen'
    case 'Verbraucht':
      return 'status status--verbraucht'
    case 'Weggeworfen':
      return 'status status--weggeworfen'
  }
}

// Sortierung nach Dringlichkeit: frühestes maßgebliches Datum zuerst.
// Bei gleichem Datum steht das Verbrauchsdatum (strenger) vor dem MHD,
// danach alphabetisch, damit die Reihenfolge immer gleich bleibt.
export function vergleicheDringlichkeit(a: Lebensmittel, b: Lebensmittel): number {
  const datumA = berechneFrist(a).datum
  const datumB = berechneFrist(b).datum
  if (datumA !== datumB) return datumA.localeCompare(datumB)
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

// Kurzer Text für die maßgebliche Frist, z. B. "MHD: 07.11.2026"
// oder "Geöffnet, haltbar bis 22.11.2026".
export function fristText(lm: Lebensmittel): string {
  const frist = berechneFrist(lm)
  return frist.quelle === 'geoeffnet'
    ? `Geöffnet, haltbar bis ${formatiereDatum(frist.datum)}`
    : `${lm.datumsart}: ${formatiereDatum(lm.datum)}`
}

// Hinweistext passend zum konkreten Lebensmittel (nutzt Kategorie-Grenzen).
// Wichtig: Die App sagt nie "ist noch essbar", sie empfiehlt nur vorsichtig.
export function hinweisFuerLebensmittel(lm: Lebensmittel): string {
  const frist = berechneFrist(lm)
  const tage = tageBis(frist.datum)
  const info = KATEGORIE_INFO[kategorieVon(lm)]

  // Verkürzte Frist, weil das Lebensmittel geöffnet/angeschnitten wurde
  if (frist.quelle === 'geoeffnet' && lm.geoeffnetAm && info.offenTage !== null) {
    const regel = `Geöffnet am ${formatiereDatum(lm.geoeffnetAm)}: Bei ${info.bezeichnung} empfehlen wir den Verbrauch innerhalb von ${tageDativ(info.offenTage)}.`
    return tage < 0
      ? `${regel} Diese Zeit ist überschritten. Bitte nicht mehr verzehren, sondern entsorgen.`
      : `${regel} Prüfe Aussehen, Geruch und Verpackung.`
  }

  // Noch nicht abgelaufen (oder am letzten Tag): allgemeiner Hinweis
  if (Number.isNaN(tage) || tage >= 0) {
    return hinweisFuerDatumsart(lm.datumsart)
  }

  const abgelaufen = Math.abs(tage)
  const seit = abgelaufen === 1 ? 'seit 1 Tag' : `seit ${abgelaufen} Tagen`

  if (lm.datumsart === 'Verbrauchsdatum') {
    return `Das Verbrauchsdatum ist ${seit} überschritten. Bitte nicht mehr verzehren, sondern entsorgen.`
  }

  const grenze = toleranzTage(lm)
  const grenzText = grenze === 0 ? 'direkt nach Ablauf' : `nach spätestens ${tageDativ(grenze)}`
  const empfehlung = `Bei ${info.bezeichnung} empfehlen wir die Entsorgung ${grenzText}.`

  if (sollEntsorgtWerden(lm)) {
    return `Das MHD ist ${seit} überschritten. ${empfehlung} Bitte nicht mehr verzehren.`
  }
  return `Das MHD ist ${seit} überschritten. ${empfehlung} Prüfe Aussehen, Geruch und Verpackung.`
}

// Hilfsfunktionen für Kalenderdaten im Format YYYY-MM-DD.
// Wichtig: Alles wird in LOKALER Zeit gerechnet. `new Date('2026-01-05')` würde
// als UTC gelesen und könnte in Deutschland je nach Uhrzeit einen Tag abweichen.

const DATUM_MUSTER = /^(\d{4})-(\d{2})-(\d{2})$/

// Prüft, ob ein String ein echtes Kalenderdatum ist (z. B. nicht 2026-02-31).
export function istGueltigesDatum(text: string): boolean {
  const treffer = DATUM_MUSTER.exec(text)
  if (!treffer) return false
  const [jahr, monat, tag] = [Number(treffer[1]), Number(treffer[2]), Number(treffer[3])]
  const d = new Date(jahr, monat - 1, tag)
  return d.getFullYear() === jahr && d.getMonth() === monat - 1 && d.getDate() === tag
}

// Wandelt ein Date in YYYY-MM-DD um (lokale Zeit, nicht UTC).
export function alsDatumString(datum: Date): string {
  const j = datum.getFullYear()
  const m = String(datum.getMonth() + 1).padStart(2, '0')
  const t = String(datum.getDate()).padStart(2, '0')
  return `${j}-${m}-${t}`
}

export function heuteAlsString(): string {
  return alsDatumString(new Date())
}

// Heutiges Datum + n Tage als YYYY-MM-DD.
export function datumInTagen(tage: number): string {
  const d = new Date()
  d.setDate(d.getDate() + tage)
  return alsDatumString(d)
}

// Volle Kalendertage von heute bis zum Datum (negativ = in der Vergangenheit).
// Über UTC-Mitternacht gerechnet, damit Sommer-/Winterzeit nichts verschiebt.
export function tageBis(datum: string): number {
  const treffer = DATUM_MUSTER.exec(datum)
  if (!treffer) return Number.NaN
  const heute = new Date()
  const heuteUtc = Date.UTC(heute.getFullYear(), heute.getMonth(), heute.getDate())
  const zielUtc = Date.UTC(Number(treffer[1]), Number(treffer[2]) - 1, Number(treffer[3]))
  return Math.round((zielUtc - heuteUtc) / 86_400_000)
}

// Deutsche Darstellung: 2026-11-17 -> 17.11.2026
export function formatiereDatum(datum: string): string {
  const treffer = DATUM_MUSTER.exec(datum)
  return treffer ? `${treffer[3]}.${treffer[2]}.${treffer[1]}` : datum
}

// Datum + n Tage (n darf negativ sein), wieder als YYYY-MM-DD in lokaler Zeit.
export function addiereTage(datum: string, tage: number): string {
  const treffer = DATUM_MUSTER.exec(datum)
  if (!treffer) return datum
  const d = new Date(Number(treffer[1]), Number(treffer[2]) - 1, Number(treffer[3]) + tage)
  return alsDatumString(d)
}

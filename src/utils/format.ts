// Kleine Formatierungs-Helfer für die Anzeige.

// Zeigt Mengen mit deutschem Komma: 1.5 -> "1,5", 500 -> "500".
export function formatiereMenge(menge: number): string {
  return menge.toLocaleString('de-DE', { maximumFractionDigits: 2 })
}

// Wandelt Eingaben wie "1,5" oder " 2.25 " in eine Zahl um (NaN bei Unsinn).
export function parseMenge(text: string): number {
  const bereinigt = text.trim().replace(',', '.')
  return bereinigt === '' ? Number.NaN : Number(bereinigt)
}

// Einkaufsliste: Dinge, die noch gekauft werden müssen.
// Wird wie die Lebensmittel im localStorage gespeichert.

import { useEffect, useState } from 'react'
import type { Einkaufsposten } from '../types/food'
import { ladeEinkaufsliste, speichereEinkaufsliste } from '../utils/storage'
import { erstelleBeispielEinkaufsliste } from '../utils/beispielDaten'

export function useEinkaufsliste() {
  const [posten, setPosten] = useState<Einkaufsposten[]>(
    () => ladeEinkaufsliste() ?? erstelleBeispielEinkaufsliste(),
  )

  useEffect(() => {
    speichereEinkaufsliste(posten)
  }, [posten])

  // Gibt false zurück, wenn der Artikel (gleicher Name) schon auf der Liste steht.
  function hinzufuegen(daten: Omit<Einkaufsposten, 'id'>): boolean {
    const name = daten.name.trim()
    if (name === '') return false
    const gibtEsSchon = posten.some((p) => p.name.toLowerCase() === name.toLowerCase())
    if (gibtEsSchon) return false
    setPosten((alt) => [...alt, { ...daten, name, id: crypto.randomUUID() }])
    return true
  }

  function entfernen(id: string) {
    setPosten((alt) => alt.filter((p) => p.id !== id))
  }

  function leeren() {
    setPosten([])
  }

  function beispieleLaden() {
    setPosten(erstelleBeispielEinkaufsliste())
  }

  return { posten, hinzufuegen, entfernen, leeren, beispieleLaden }
}

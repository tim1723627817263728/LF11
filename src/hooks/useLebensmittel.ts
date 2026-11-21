// Zentrale Stelle für alle Änderungen an den Lebensmittel-Daten.
// Lädt beim Start aus dem localStorage, legt beim allerersten Start
// (und nur dann) Beispieldaten an und speichert jede Änderung automatisch.

import { useEffect, useState } from 'react'
import type { ArchivGrund, Lebensmittel, LebensmittelFormDaten } from '../types/food'
import {
  ladeLebensmittel,
  markiereAlsInitialisiert,
  speichereLebensmittel,
  warBereitsInitialisiert,
} from '../utils/storage'
import { erstelleBeispielDaten } from '../utils/beispielDaten'

export function useLebensmittel() {
  const [liste, setListe] = useState<Lebensmittel[]>([])
  const [istGeladen, setIstGeladen] = useState(false)
  const [speicherFehler, setSpeicherFehler] = useState(false)

  useEffect(() => {
    const gespeichert = ladeLebensmittel()
    if (gespeichert.length === 0 && !warBereitsInitialisiert()) {
      setListe(erstelleBeispielDaten())
    } else {
      setListe(gespeichert)
    }
    markiereAlsInitialisiert()
    setIstGeladen(true)
  }, [])

  useEffect(() => {
    if (istGeladen) {
      setSpeicherFehler(!speichereLebensmittel(liste))
    }
  }, [liste, istGeladen])

  function lebensmittelHinzufuegen(daten: LebensmittelFormDaten) {
    const neu: Lebensmittel = {
      ...daten,
      id: crypto.randomUUID(),
      verbraucht: false,
      erstelltAm: new Date().toISOString(),
    }
    setListe((alt) => [...alt, neu])
  }

  function lebensmittelBearbeiten(id: string, daten: LebensmittelFormDaten) {
    setListe((alt) => alt.map((e) => (e.id === id ? { ...e, ...daten } : e)))
  }

  // Verschiebt einen oder mehrere Einträge ins Archiv (verbraucht ODER weggeworfen).
  function lebensmittelAbschliessen(ids: string[], grund: ArchivGrund) {
    const jetzt = new Date().toISOString()
    setListe((alt) =>
      alt.map((e) =>
        ids.includes(e.id) ? { ...e, verbraucht: true, verbrauchtAm: jetzt, archivGrund: grund } : e,
      ),
    )
  }

  // Setzt die Restmenge. Bei 0 gilt das Lebensmittel als komplett verbraucht.
  function lebensmittelMengeAendern(id: string, neueMenge: number) {
    if (neueMenge <= 0) {
      lebensmittelAbschliessen([id], 'verbraucht')
      return
    }
    setListe((alt) => alt.map((e) => (e.id === id ? { ...e, menge: neueMenge } : e)))
  }

  // Holt einen archivierten Eintrag zurück in die aktive Liste.
  function lebensmittelWiederherstellen(id: string) {
    setListe((alt) =>
      alt.map((e) =>
        e.id === id
          ? { ...e, verbraucht: false, verbrauchtAm: undefined, archivGrund: undefined }
          : e,
      ),
    )
  }

  function lebensmittelLoeschen(ids: string[]) {
    setListe((alt) => alt.filter((e) => !ids.includes(e.id)))
  }

  function archivLeeren() {
    setListe((alt) => alt.filter((e) => !e.verbraucht))
  }

  // Ersetzt ALLE Daten durch die Beispieldaten (für die Vorführung).
  function beispieldatenLaden() {
    setListe(erstelleBeispielDaten())
  }

  // Ersetzt die komplette Liste (wird für "Rückgängig" genutzt).
  function listeSetzen(neueListe: Lebensmittel[]) {
    setListe(neueListe)
  }

  return {
    liste,
    listeSetzen,
    istGeladen,
    speicherFehler,
    lebensmittelHinzufuegen,
    lebensmittelBearbeiten,
    lebensmittelAbschliessen,
    lebensmittelMengeAendern,
    lebensmittelWiederherstellen,
    lebensmittelLoeschen,
    archivLeeren,
    beispieldatenLaden,
  }
}

// Hell/Dunkel-Modus: Startwert = gespeicherte Wahl oder Systemeinstellung.
// Setzt das Attribut data-theme am <html>-Element, das CSS reagiert darauf.

import { useEffect, useState } from 'react'
import { ladeFarbschema, speichereFarbschema } from '../utils/storage'
import type { Farbschema } from '../utils/storage'

export function wendeFarbschemaAn(schema: Farbschema) {
  document.documentElement.dataset.theme = schema
}

export function useFarbschema() {
  const [schema, setSchema] = useState<Farbschema>(() => ladeFarbschema())

  useEffect(() => {
    wendeFarbschemaAn(schema)
    speichereFarbschema(schema)
  }, [schema])

  function umschalten() {
    setSchema((alt) => (alt === 'hell' ? 'dunkel' : 'hell'))
  }

  return { schema, umschalten }
}

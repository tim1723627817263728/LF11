// Das Formular meldet über diesen Kontext an die App, ob es ungespeicherte
// Eingaben enthält. So kann die App beim Seitenwechsel warnen.

import { createContext, useContext } from 'react'

export const FormularWaechterContext = createContext<(geaendert: boolean) => void>(() => {})

export function useFormularWaechter() {
  return useContext(FormularWaechterContext)
}

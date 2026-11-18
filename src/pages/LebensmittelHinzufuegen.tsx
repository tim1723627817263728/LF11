// Seite zum Hinzufügen eines neuen Lebensmittels.
// Nutzt das gemeinsame Formular-Component. Mit "startwerte" kann das
// Formular vorausgefüllt werden (z. B. aus der Einkaufsliste).

import type { LebensmittelFormDaten } from '../types/food'
import { LebensmittelFormular } from '../components/LebensmittelFormular'

interface Props {
  startwerte?: Partial<LebensmittelFormDaten>
  onSpeichern: (daten: LebensmittelFormDaten) => void
  onAbbrechen: () => void
}

export function LebensmittelHinzufuegen({ startwerte, onSpeichern, onAbbrechen }: Props) {
  return (
    <section className="seite">
      <h1>Lebensmittel hinzufügen</h1>
      <LebensmittelFormular
        startwerte={startwerte}
        onSpeichern={onSpeichern}
        onAbbrechen={onAbbrechen}
      />
    </section>
  )
}

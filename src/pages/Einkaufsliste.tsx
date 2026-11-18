// Einkaufsliste: Dinge, die noch gekauft werden müssen.
// "In Vorrat" öffnet das Hinzufügen-Formular mit vorausgefüllten Werten,
// sodass nur noch das Datum eingetragen werden muss.

import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Einkaufsposten } from '../types/food'
import { formatiereMenge } from '../utils/format'
import { Button } from '../components/Button'

interface Props {
  posten: Einkaufsposten[]
  onHinzufuegen: (name: string) => boolean
  onInVorrat: (posten: Einkaufsposten) => void
  onEntfernen: (id: string) => void
  onLeeren: () => void
}

export function Einkaufsliste({ posten, onHinzufuegen, onInVorrat, onEntfernen, onLeeren }: Props) {
  const [name, setName] = useState('')
  const [fehler, setFehler] = useState('')

  function absenden(event: FormEvent) {
    event.preventDefault()
    if (name.trim() === '') {
      setFehler('Bitte gib einen Namen ein.')
      return
    }
    if (!onHinzufuegen(name)) {
      setFehler('Dieser Artikel steht schon auf der Liste.')
      return
    }
    setName('')
    setFehler('')
  }

  return (
    <section className="seite seite--schmal">
      <h1>Einkaufsliste</h1>
      <p className="seite__untertitel">
        Nach dem Einkauf: „In Vorrat“ drücken und das Datum eintragen.
      </p>

      <form className="einkauf-formular" onSubmit={absenden}>
        <input
          type="text"
          className="filterleiste__suche"
          placeholder="Artikel hinzufügen, z. B. Nudeln"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setFehler('')
          }}
          aria-label="Neuer Artikel"
        />
        <Button type="submit" variante="primaer">
          Hinzufügen
        </Button>
      </form>
      {fehler && <p className="formular__fehler einkauf-fehler">{fehler}</p>}

      {posten.length === 0 ? (
        <p className="leer">Die Einkaufsliste ist leer.</p>
      ) : (
        <>
          <ul className="einkauf-liste">
            {posten.map((p) => (
              <li key={p.id} className="einkauf-eintrag">
                <div className="einkauf-eintrag__info">
                  <strong>{p.name}</strong>
                  <span className="dashboard__eintrag-datum">
                    {formatiereMenge(p.menge)} {p.einheit}
                  </span>
                </div>
                <div className="einkauf-eintrag__aktionen">
                  <Button variante="primaer" className="btn--klein" onClick={() => onInVorrat(p)}>
                    In Vorrat
                  </Button>
                  <Button
                    variante="sekundaer"
                    className="btn--klein"
                    onClick={() => onEntfernen(p.id)}
                    aria-label={`${p.name} entfernen`}
                  >
                    Entfernen
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <div className="archiv__fuss">
            <Button variante="gefahr" onClick={onLeeren}>
              Liste leeren
            </Button>
          </div>
        </>
      )}
    </section>
  )
}

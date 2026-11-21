// Kleine Hinweisbox für die Sicherheits-Hinweise zu MHD / Verbrauchsdatum.
// Wird auf der Detail-/Formular-Ansicht und in den Karten genutzt.

interface Props {
  text: string
  warnung?: boolean // hebt den Hinweis hervor (z. B. Entsorgung empfohlen)
}

export function HinweisBox({ text, warnung = false }: Props) {
  return (
    <p className={warnung ? 'hinweis-box hinweis-box--warnung' : 'hinweis-box'}>
      <strong>Hinweis: </strong>
      {text}
    </p>
  )
}

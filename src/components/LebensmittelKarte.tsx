// Zeigt ein einzelnes Lebensmittel als Karte an, inklusive
// Status, Hinweistext und den Aktions-Buttons.
// Im Auswahlmodus (Mehrfachauswahl) ersetzt eine Checkbox die Buttons.

import type { Lebensmittel } from '../types/food'
import { berechneStatus, hinweisFuerDatumsart, restzeitText, tageBisDatum } from '../utils/status'
import { formatiereDatum } from '../utils/datum'
import { formatiereMenge } from '../utils/format'
import { StatusBadge } from './StatusBadge'
import { HinweisBox } from './HinweisBox'
import { Button } from './Button'

interface Props {
  lebensmittel: Lebensmittel
  onBearbeiten: (lebensmittel: Lebensmittel) => void
  onVerbraucht: (lebensmittel: Lebensmittel) => void
  onWeggeworfen: (lebensmittel: Lebensmittel) => void
  onRestAnpassen: (lebensmittel: Lebensmittel) => void
  // Mehrfachauswahl
  auswahlModus?: boolean
  ausgewaehlt?: boolean
  onAuswahlWechseln?: (lebensmittel: Lebensmittel) => void
}

export function LebensmittelKarte({
  lebensmittel,
  onBearbeiten,
  onVerbraucht,
  onWeggeworfen,
  onRestAnpassen,
  auswahlModus = false,
  ausgewaehlt = false,
  onAuswahlWechseln,
}: Props) {
  const status = berechneStatus(lebensmittel)
  const tage = tageBisDatum(lebensmittel.datum)
  const hinweis = hinweisFuerDatumsart(lebensmittel.datumsart)

  return (
    <article className={`karte${ausgewaehlt ? ' karte--gewaehlt' : ''}`}>
      <div className="karte__kopf">
        {auswahlModus && (
          <input
            type="checkbox"
            className="karte__checkbox"
            checked={ausgewaehlt}
            onChange={() => onAuswahlWechseln?.(lebensmittel)}
            aria-label={`${lebensmittel.name} auswählen`}
          />
        )}
        <h3 className="karte__titel">{lebensmittel.name}</h3>
        <StatusBadge status={status} />
      </div>

      <dl className="karte__details">
        <div className="karte__zeile">
          <dt>Menge</dt>
          <dd>
            {formatiereMenge(lebensmittel.menge)} {lebensmittel.einheit}
          </dd>
        </div>
        {lebensmittel.kategorie && (
          <div className="karte__zeile">
            <dt>Kategorie</dt>
            <dd>{lebensmittel.kategorie}</dd>
          </div>
        )}
        <div className="karte__zeile">
          <dt>Lagerort</dt>
          <dd>{lebensmittel.lagerort}</dd>
        </div>
        <div className="karte__zeile">
          <dt>{lebensmittel.datumsart}</dt>
          <dd>
            {formatiereDatum(lebensmittel.datum)}
            <span className="karte__tage">
              <br />
              {restzeitText(tage)}
            </span>
          </dd>
        </div>
        {lebensmittel.notiz && (
          <div className="karte__zeile">
            <dt>Notiz</dt>
            <dd>{lebensmittel.notiz}</dd>
          </div>
        )}
      </dl>

      <HinweisBox text={hinweis} />

      {!auswahlModus && (
        <div className="karte__aktionen">
          <Button variante="primaer" onClick={() => onVerbraucht(lebensmittel)}>
            Verbraucht
          </Button>
          <Button variante="sekundaer" onClick={() => onWeggeworfen(lebensmittel)}>
            Weggeworfen
          </Button>
          <Button variante="sekundaer" onClick={() => onRestAnpassen(lebensmittel)}>
            Rest anpassen
          </Button>
          <Button variante="sekundaer" onClick={() => onBearbeiten(lebensmittel)}>
            Bearbeiten
          </Button>
        </div>
      )}
    </article>
  )
}

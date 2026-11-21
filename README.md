# FreshTrack

FreshTrack ist ein einfacher **MVP-Prototyp** (kein fertiges Produkt), der privaten Haushalten hilft, Lebensmittel im Kühlschrank, Gefrierfach und Vorratsschrank zu verwalten. Ziel: weniger Lebensmittelverschwendung und weniger Doppelkäufe.

## Technik

- React + TypeScript + Vite
- Reines CSS (kein UI-Framework)
- Keine Anmeldung, kein Backend, keine Datenbank
- Alle Daten liegen im **localStorage** des Browsers

## Funktionen

- **Heute:** Zähler nach Status, Hinweis auf zeitnah ablaufende Lebensmittel und die Bilanz
- **Lebensmittel:** Suche, Filter (Lagerort/Status/Kategorie), Sortierung, Mehrfachauswahl
- **Aktionen pro Lebensmittel:** Verbraucht, Weggeworfen, Rest anpassen (z. B. "zur Hälfte verbraucht"), Bearbeiten, Löschen
- **Hinzufügen:** Schnellauswahl für häufige Produkte, Dezimalkomma bei Mengen, feste Kategorien (Pflichtfeld, mit Vorschlag aus dem Namen) und "bereits geöffnet" (verkürzt die Haltbarkeit je Kategorie)
- **Einkaufsliste:** Artikel notieren, per "In Vorrat" nach dem Einkauf direkt erfassen
- **Archiv:** Wiederherstellen, "Nochmal kaufen" (landet auf der Einkaufsliste), Bilanz verbraucht/weggeworfen inklusive der am häufigsten weggeworfenen Kategorien
- **Rückgängig:** Verbraucht, Weggeworfen, Löschen, Restmenge und Archiv leeren lassen sich über den Hinweis am unteren Rand zurücknehmen
- **Schutz vor Datenverlust:** Wer mit ungespeicherten Eingaben die Seite wechselt, wird gewarnt
- **Entsorgungs-Empfehlung:** Je nach Kategorie (z. B. Milchprodukte 3 Tage, Fleisch 1 Tag, Trockenwaren 180 Tage) gibt es feste Grenzen. Ist das MHD länger überschritten, steht "Entsorgung empfohlen" statt "Zeitnah verwenden". Beim Verbrauchsdatum gilt das sofort nach Ablauf. Die Werte stehen in `src/utils/kategorien.ts` (Richtwerte je Kategorie) und `src/utils/haltbarkeit.ts` (Regeln) und sind dort anpassbar.
- **Erinnerung:** Beim Start (einmal pro Browser-Sitzung) ein Hinweis auf dringende Lebensmittel
- **Dark Mode:** Umschalter oben rechts, die Wahl wird gespeichert
- **Beispieldaten zurücksetzen:** Knopf unten, praktisch für Vorführungen

## Projekt starten

Voraussetzung: [Node.js](https://nodejs.org/) (Version 18 oder neuer) ist installiert.

```bash
npm install
npm run dev
```

Danach im Terminal auf den angezeigten Link klicken (meist `http://localhost:5173`).

Weitere Befehle:

```bash
npm run build     # Erstellt eine produktionsreife Version im Ordner dist/
npm run preview   # Zeigt die gebaute Version lokal an
```

## Wo werden die Daten gespeichert?

FreshTrack speichert **alle Lebensmittel-Daten direkt im Browser**, im sogenannten `localStorage`. Es gibt keinen Server und keine Datenbank.

- Speicherort: `localStorage` des Browsers, unter den Schlüsseln `freshtrack_lebensmittel` (Vorrat und Archiv), `freshtrack_einkaufsliste` und `freshtrack_theme`
- Die Daten bleiben erhalten, solange du denselben Browser auf demselben Gerät benutzt und den Browser-Speicher nicht manuell löschst
- Öffnest du die App in einem anderen Browser oder auf einem anderen Gerät, siehst du **andere Daten** (localStorage ist immer an einen Browser gebunden)
- Löschst du den Browser-Cache/-Speicher (z. B. über "Browserdaten löschen"), gehen die FreshTrack-Daten verloren
- Du kannst die Daten im Browser selbst einsehen: Entwicklertools öffnen (F12) → Tab "Anwendung"/"Application" → "Local Storage" → deine Seite → Schlüssel `freshtrack_lebensmittel`

Beim allerersten Start (wenn im localStorage noch nichts gespeichert ist) legt die App automatisch **8 Beispiel-Lebensmittel** an, damit man die Funktionen direkt ausprobieren kann.

## Ordnerstruktur

```
src/
  components/   Wiederverwendbare UI-Bausteine (Karte, Button, Formular, Dialog, Status-Badge, Hinweisbox)
  pages/        Die vier "Seiten" der App (Dashboard, Hinzufügen, Übersicht, Archiv)
  types/        TypeScript-Typen für ein Lebensmittel
  utils/        Reine Hilfsfunktionen: Status-Berechnung, localStorage-Zugriff, Beispieldaten
  hooks/        useLebensmittel: zentrale Logik zum Laden/Speichern/Ändern der Lebensmittel-Liste
  styles/       Eine globale CSS-Datei mit allen Styles
```

## Wichtige Hinweise zur Statuslogik

Der Status eines Lebensmittels wird **automatisch** aus dem gespeicherten Datum berechnet:

| Zeit bis zum Datum | Status |
|---|---|
| Mehr als 5 Tage | Frisch |
| 3 bis 5 Tage | Bald prüfen |
| 0 bis 2 Tage (oder bereits abgelaufen) | Zeitnah verwenden oder prüfen |
| Manuell markiert | Verbraucht |

FreshTrack behauptet **niemals**, dass ein Lebensmittel sicher essbar ist. Je nach gewählter Datumsart wird immer einer dieser Hinweise angezeigt:

- **MHD:** "MHD ist kein automatisches Wegwerfdatum. Prüfe Aussehen, Geruch und Verpackung."
- **Verbrauchsdatum:** "Verbrauchsdatum beachten."

## Hinweis

Dies ist ein **MVP-Prototyp** für Lern- und Demonstrationszwecke, gedacht z. B. für den Berufsschul-Unterricht. Der Code ist bewusst einfach gehalten, mit deutschen Bezeichnern und ausführlichen Kommentaren, ohne komplexe Architektur oder externe APIs.

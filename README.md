# Binnenboom Patroonkaart

Web-app voor Praktijk Binnenboom (Hanneke Meijer, NEI therapie in Best). Gebruikers
tracken 21 dagen lang dagelijks momenten waarop een onbewust patroon getriggerd
wordt en krijgen na afloop een visuele patroonkaart als inzicht en gespreksopener.

## Lokaal draaien

```bash
npm install
npm run dev
```

De app draait op `http://localhost:5173`.

## Bouwen

```bash
npm run build
npm run preview
```

## Opslag

De app gebruikt `window.storage` (Claude artifact runtime) als die beschikbaar is
en valt anders terug op `localStorage`. Alle data blijft op het apparaat van de
gebruiker. Keys:

- `patroon:beschrijving` — vrije tekst van de gebruiker
- `patroon:startdatum` — startdatum (YYYY-MM-DD)
- `checkin:YYYY-MM-DD` — dagelijkse check-in payload

## Demo

Op het welkomstscherm staat een "Bekijk voorbeeld patroonkaart" knop die direct
naar een patroonkaart met dummy data springt. Bedoeld voor conversie.

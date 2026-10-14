# backend

JavaScript-Backend auf Basis von [Bun](https://bun.com).

## Voraussetzungen

Bun installieren (falls noch nicht vorhanden):

```bash
curl -fsSL https://bun.sh/install | bash
```

## Einrichtung

```bash
bun install
cp .env.example .env
```

## Scripts

| Befehl         | Beschreibung                                    |
| -------------- | ----------------------------------------------- |
| `bun run dev`  | Server mit Hot-Reload starten (`--hot`)         |
| `bun run start`| Server ohne Hot-Reload starten                  |
| `bun test`     | Tests ausführen (`*.test.js`)                   |

Der Server läuft standardmäßig auf http://localhost:3000 (`PORT` in `.env` anpassbar).

## Struktur

```
src/
  index.js       Einstiegspunkt (Bun.serve)
  index.test.js  Beispieltest (bun:test)
jsconfig.json    Editor-Autovervollständigung für Bun-APIs
.env.example     Vorlage für Umgebungsvariablen
```

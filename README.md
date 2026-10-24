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

## Endpunkte

| Methode | Pfad    | Beschreibung | Antwort |
| ------- | ------- | ------------ | ------- |
| GET     | `/`     | Health/Beispiel | `{"message": "Hello via Bun!"}` |
| GET     | `/health` | Healthcheck | `{"status": "ok"}` |
| GET     | `/time`   | Aktuelle Zeit per NTP | `{"time": "<ISO-8601-UTC>", "unixMs": <number>, "source": "ntp"}` |

Beispielaufruf:

```bash
curl http://localhost:3000/time
```

Bei NTP-Fehler antwortet der Endpunkt mit HTTP 503:

```json
{"error": "NTP time unavailable"}
```

## Konfiguration

| Variable | Standard | Beschreibung |
| -------- | -------- | ------------ |
| `PORT` | `3000` | Port des HTTP-Servers |
| `NTP_SERVER` | `pool.ntp.org` | NTP-Server für Zeitabfrage (IPv4) |
| `NTP_TIMEOUT_MS` | `2000` | Timeout für NTP-Abfrage in Millisekunden |

## Struktur

```
src/
  index.js       Einstiegspunkt (Bun.serve), exportiert createServer
  index.test.js  Tests für Routen
  ntp.js         NTP-Client (UDP, IPv4)
  ntp.test.js    Tests für NTP-Client
jsconfig.json    Editor-Autovervollständigung für Bun-APIs
.env.example     Vorlage für Umgebungsvariablen
```

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>`
- This project uses plain JavaScript (ESM), not TypeScript. Source lives in `src/`.
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

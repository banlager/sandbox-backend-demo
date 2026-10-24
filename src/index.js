import { queryNtpTime } from "./ntp.js";

const DEFAULT_PORT = 3000;
const DEFAULT_NTP_SERVER = "pool.ntp.org";
const DEFAULT_NTP_TIMEOUT_MS = 2000;

function parsePositiveInt(value, name) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    throw new Error(`Ungültiger Wert für ${name}: ${value}`);
  }
  return num;
}

const configuredPort = parsePositiveInt(Bun.env.PORT, "PORT");
const configuredTimeout = parsePositiveInt(Bun.env.NTP_TIMEOUT_MS, "NTP_TIMEOUT_MS");
const ntpServer = Bun.env.NTP_SERVER || DEFAULT_NTP_SERVER;
const port = configuredPort ?? DEFAULT_PORT;
const timeoutMs = configuredTimeout ?? DEFAULT_NTP_TIMEOUT_MS;

function getDefaultQueryTime() {
  return queryNtpTime({ host: ntpServer, timeoutMs });
}

export function createServer({ port: serverPort = port, queryTime = getDefaultQueryTime } = {}) {
  const server = Bun.serve({
    port: serverPort,
    routes: {
      "/": () => Response.json({ message: "Hello via Bun!" }),
      "/health": () => Response.json({ status: "ok" }),
      "/time": async () => {
        try {
          const date = await queryTime();
          return Response.json(
            {
              time: date.toISOString(),
              unixMs: date.getTime(),
              source: "ntp",
            },
            {
              headers: {
                "Cache-Control": "no-store",
              },
            }
          );
        } catch (err) {
          console.error("NTP-Fehler:", err?.message || err);
          return Response.json({ error: "NTP time unavailable" }, { status: 503 });
        }
      },
    },
    fetch() {
      return new Response("Not Found", { status: 404 });
    },
  });

  return server;
}

if (import.meta.main) {
  const server = createServer({ port });
  console.log(`Server läuft auf http://localhost:${server.port}`);
}

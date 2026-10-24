import { test, expect } from "bun:test";
import { createServer } from "./index.js";

test("Beispieltest", () => {
  expect(1 + 1).toBe(2);
});

test("GET / gibt Hello-Nachricht zurück", async () => {
  const server = createServer({ port: 0, queryTime: async () => new Date() });
  const res = await fetch(`http://localhost:${server.port}/`);
  expect(res.status).toBe(200);
  const json = await res.json();
  expect(json.message).toBe("Hello via Bun!");
  server.stop();
});

test("GET /health gibt ok zurück", async () => {
  const server = createServer({ port: 0, queryTime: async () => new Date() });
  const res = await fetch(`http://localhost:${server.port}/health`);
  expect(res.status).toBe(200);
  const json = await res.json();
  expect(json.status).toBe("ok");
  server.stop();
});

test("GET /time gibt NTP-Zeit zurück", async () => {
  const fixed = new Date("2024-01-01T00:00:00.000Z");
  const server = createServer({ port: 0, queryTime: async () => fixed });
  const res = await fetch(`http://localhost:${server.port}/time`);
  expect(res.status).toBe(200);
  expect(res.headers.get("cache-control")).toBe("no-store");
  const json = await res.json();
  expect(json.time).toBe("2024-01-01T00:00:00.000Z");
  expect(json.unixMs).toBe(fixed.getTime());
  expect(json.source).toBe("ntp");
  server.stop();
});

test("GET /time gibt 503 bei NTP-Fehler", async () => {
  const server = createServer({
    port: 0,
    queryTime: async () => {
      throw new Error("NTP-Timeout");
    },
  });
  const res = await fetch(`http://localhost:${server.port}/time`);
  expect(res.status).toBe(503);
  const json = await res.json();
  expect(json.error).toBe("NTP time unavailable");
  server.stop();
});

test("Unbekannte Route gibt 404", async () => {
  const server = createServer({ port: 0, queryTime: async () => new Date() });
  const res = await fetch(`http://localhost:${server.port}/unknown`);
  expect(res.status).toBe(404);
  server.stop();
});

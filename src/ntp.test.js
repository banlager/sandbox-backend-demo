import { test, expect } from "bun:test";
import dgram from "node:dgram";
import { createNtpRequestBuffer, parseNtpResponseBuffer, queryNtpTime } from "./ntp.js";

function createFakeNtpResponse(requestBuffer, offsetSeconds = 0) {
  const buf = Buffer.alloc(48);
  // Set mode to server (4)
  buf[0] = 0x24; // LI=0, VN=4, Mode=4
  buf[1] = 2; // stratum

  const now = Date.now() / 1000 + offsetSeconds;
  const ntpSeconds = Math.floor(now + 2208988800);
  const ntpFrac = Math.floor((now % 1) * 0x100000000);

  // Copy origin timestamp
  const origin = requestBuffer.readUInt32BE(40);
  buf.writeUInt32BE(origin, 24);
  buf.writeUInt32BE(ntpSeconds, 32); // receive
  buf.writeUInt32BE(ntpSeconds, 40); // transmit

  return buf;
}

test("createNtpRequestBuffer erzeugt 48 Bytes mit korrektem Header", () => {
  const buf = createNtpRequestBuffer();
  expect(buf.length).toBe(48);
  expect(buf[0]).toBe(0x23);
});

test("parseNtpResponseBuffer rechnet NTP-Zeit in Date um", () => {
  const req = createNtpRequestBuffer();
  const res = createFakeNtpResponse(req, 0);
  const date = parseNtpResponseBuffer(req, res);
  expect(date).toBeInstanceOf(Date);
  expect(isNaN(date.getTime())).toBe(false);
});

test("parseNtpResponseBuffer wirft bei falscher Länge", () => {
  const req = createNtpRequestBuffer();
  expect(() => parseNtpResponseBuffer(req, Buffer.alloc(47))).toThrow();
});

test("parseNtpResponseBuffer wirft bei falschem Modus", () => {
  const req = createNtpRequestBuffer();
  const res = createFakeNtpResponse(req);
  res[0] = 0x23; // client mode
  expect(() => parseNtpResponseBuffer(req, res)).toThrow();
});

test("parseNtpResponseBuffer wirft bei ungültigem Stratum", () => {
  const req = createNtpRequestBuffer();
  const res = createFakeNtpResponse(req);
  res[1] = 0;
  expect(() => parseNtpResponseBuffer(req, res)).toThrow();
  res[1] = 16;
  expect(() => parseNtpResponseBuffer(req, res)).toThrow();
});

test("parseNtpResponseBuffer wirft bei Origin-Timestamp-Mismatch", () => {
  const req = createNtpRequestBuffer();
  const res = createFakeNtpResponse(req);
  res.writeUInt32BE(12345, 24);
  expect(() => parseNtpResponseBuffer(req, res)).toThrow();
});

test("queryNtpTime mit lokalem Fake-Server funktioniert", async () => {
  const server = dgram.createSocket("udp4");
  server.on("message", (msg, rinfo) => {
    const req = msg;
    const res = createFakeNtpResponse(req);
    server.send(res, 0, res.length, rinfo.port, rinfo.address);
  });
  await new Promise((resolve) => server.bind(0, "127.0.0.1", resolve));
  const port = server.address().port;

  const date = await queryNtpTime({ host: "127.0.0.1", port, timeoutMs: 1000 });
  expect(date).toBeInstanceOf(Date);
  server.close();
});

test("queryNtpTime wirft bei Timeout", async () => {
  const server = dgram.createSocket("udp4");
  await new Promise((resolve) => server.bind(0, "127.0.0.1", resolve));
  const port = server.address().port;
  // No response sent

  await expect(queryNtpTime({ host: "127.0.0.1", port, timeoutMs: 100 })).rejects.toThrow(/Timeout/);
  server.close();
});

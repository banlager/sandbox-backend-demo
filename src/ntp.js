import dgram from "node:dgram";

const NTP_EPOCH_OFFSET = 2208988800; // seconds between 1900-01-01 and 1970-01-01

function createNtpRequest() {
  const buf = Buffer.alloc(48);
  buf[0] = 0x23; // LI=0, Version=4, Mode=3
  return buf;
}

function readUInt32BE(buf, offset) {
  return buf.readUInt32BE(offset);
}

function readTimestamp(buf, offset) {
  const seconds = readUInt32BE(buf, offset);
  const fraction = readUInt32BE(buf, offset + 4);
  // Convert NTP fraction (2^32) to milliseconds
  const ms = (fraction / 0x100000000) * 1000;
  const unixSeconds = seconds - NTP_EPOCH_OFFSET;
  return unixSeconds * 1000 + ms;
}

function parseNtpResponse(requestBuffer, responseBuffer) {
  if (!Buffer.isBuffer(responseBuffer) || responseBuffer.length < 48) {
    throw new Error("Ungültige NTP-Antwort: Länge zu kurz");
  }

  const mode = responseBuffer[0] & 0x07;
  if (mode !== 4) {
    throw new Error("Ungültige NTP-Antwort: Modus nicht Server");
  }

  const stratum = responseBuffer[1];
  if (stratum < 1 || stratum > 15) {
    throw new Error("Ungültige NTP-Antwort: ungültiges Stratum");
  }

  const originTimestamp = readUInt32BE(responseBuffer, 24);
  const requestTransmitTimestamp = readUInt32BE(requestBuffer, 40);
  if (originTimestamp !== requestTransmitTimestamp) {
    throw new Error("Ungültige NTP-Antwort: Origin-Timestamp stimmt nicht überein");
  }

  // t1: local send, t2: remote receive, t3: remote transmit, t4: local receive
  const t1 = readTimestamp(requestBuffer, 40); // request transmit
  const t2 = readTimestamp(responseBuffer, 32); // receive
  const t3 = readTimestamp(responseBuffer, 40); // transmit
  const t4 = Date.now(); // local receive (approx)

  // Offset calculation
  const offsetMs = ((t2 - t1) + (t3 - t4)) / 2;
  const now = new Date(t4 + offsetMs);
  return now;
}

export function queryNtpTime({ host = "pool.ntp.org", port = 123, timeoutMs = 2000 } = {}) {
  if (typeof timeoutMs !== "number" || !Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return Promise.reject(new Error("Ungültiger Timeout"));
  }

  return new Promise((resolve, reject) => {
    const socket = dgram.createSocket("udp4");
    let settled = false;
    const requestBuffer = createNtpRequest();

    const cleanup = () => {
      if (settled) return;
      settled = true;
      try {
        socket.close();
      } catch {}
    };

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("NTP-Timeout"));
    }, timeoutMs);

    socket.on("error", (err) => {
      clearTimeout(timeout);
      cleanup();
      reject(err);
    });

    socket.on("message", (msg) => {
      clearTimeout(timeout);
      try {
        const now = parseNtpResponse(requestBuffer, msg);
        cleanup();
        resolve(now);
      } catch (err) {
        cleanup();
        reject(err);
      }
    });

    try {
      socket.send(requestBuffer, 0, requestBuffer.length, port, host, (err) => {
        if (err) {
          clearTimeout(timeout);
          cleanup();
          reject(err);
        }
      });
    } catch (err) {
      clearTimeout(timeout);
      cleanup();
      reject(err);
    }
  });
}

export function createNtpRequestBuffer() {
  return createNtpRequest();
}

export function parseNtpResponseBuffer(requestBuffer, responseBuffer) {
  return parseNtpResponse(requestBuffer, responseBuffer);
}

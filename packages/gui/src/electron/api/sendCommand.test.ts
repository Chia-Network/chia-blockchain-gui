import fs from 'node:fs';
import https from 'node:https';
import os from 'node:os';
import path from 'node:path';

import { dump } from 'js-yaml';
import JSONBig from 'json-bigint';
import WebSocket, { WebSocketServer } from 'ws';

type WireMessage = {
  request_id: string;
  command: string;
  destination: string;
  origin: string;
  data?: Record<string, unknown>;
  ack: boolean;
};

const TEST_CERT = `-----BEGIN CERTIFICATE-----
MIIDCzCCAfOgAwIBAgIUbDXyhygzrTE/4EDKN+bGzleK8CgwDQYJKoZIhvcNAQEL
BQAwFDESMBAGA1UEAwwJbG9jYWxob3N0MCAXDTI2MDUyNjE0MzkwMFoYDzIwNTYw
NTE4MTQzOTAwWjAUMRIwEAYDVQQDDAlsb2NhbGhvc3QwggEiMA0GCSqGSIb3DQEB
AQUAA4IBDwAwggEKAoIBAQDSB7JKxQu0P9GI8bDBELbB0M7Gg+muTTS3fJiFvvXS
YTIsW19vxurHilCK3m+ncE0gLsjDsCbtCbwmtrIT5A4OFmfucV0qIIfA2yCL1TtC
udD4zUmudv0cJy6Yb09xEknzCBCAWjq8rQZ2MdsQnpPcMMwb61/8Bd5cFoXuyn/E
HWJeQmiVzalevtCDAnOQC72mkIZTEdXSnxnlHAunLDZB2m8CquyOMjnzJaQOdp9n
aDzkuYgEkqKwJtMZi/QLEMET0p0j5Hzm+k4pATPLnGTC4DqEFJUArgC0hXrPCvHy
QshvfpYpH24Zsc60+7Y78ZsGYiFoWvlMw/0b2/7KKJn9AgMBAAGjUzBRMB0GA1Ud
DgQWBBSk8HpIuVJOGOPMV6W8PvOpN0LApDAfBgNVHSMEGDAWgBSk8HpIuVJOGOPM
V6W8PvOpN0LApDAPBgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IBAQC8
qHlbBh9cAUXIkjQspJMEVsL2xRg4qlhKeEs8FSVusJeiwgVJ7fF0nJcXi5eKQ3d1
KbQowISBN5rTC3l6wkGLB1IVjYRyeGNnJ6e7z1+jtl9SvwLXI1/6BZnx5+GUtqKx
rMZrlyPmqk74HzHdE8M7bGJhQ0S1efR3zBPfETH+G8mp7L8t2kULzVo2TLk0imNj
KOAZeCtd4fnbNyJoh6ayZecLBhkFyVaLYgim2mK8kNkgtir8pL/xpdLOb98Ph5Hv
Z0QI0/h7Gz92/U0FmenUis+CEciNFwnTeMpTt+qkyTydcIbpJn71J4dgCtLJaZMT
BaJJZqnnu/hNdnLjS2eR
-----END CERTIFICATE-----
`;

const TEST_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDSB7JKxQu0P9GI
8bDBELbB0M7Gg+muTTS3fJiFvvXSYTIsW19vxurHilCK3m+ncE0gLsjDsCbtCbwm
trIT5A4OFmfucV0qIIfA2yCL1TtCudD4zUmudv0cJy6Yb09xEknzCBCAWjq8rQZ2
MdsQnpPcMMwb61/8Bd5cFoXuyn/EHWJeQmiVzalevtCDAnOQC72mkIZTEdXSnxnl
HAunLDZB2m8CquyOMjnzJaQOdp9naDzkuYgEkqKwJtMZi/QLEMET0p0j5Hzm+k4p
ATPLnGTC4DqEFJUArgC0hXrPCvHyQshvfpYpH24Zsc60+7Y78ZsGYiFoWvlMw/0b
2/7KKJn9AgMBAAECggEAAIKmxwI8EUvPZ0kJECsJeqaWfgp/hJ4o6OI7X6XTZJe6
Xru5G2UtGF+IaxH3zP0bnt6mO71/lrddlu1+OMim1RduWLi7THkoQ0p1BYn22yZm
8NfU3EDrRAh/Vzz8AS8VcWr9WUZ+2osEF0DvQpbUDqaqtE2p3cuo2unuGOKylUgo
3lzwHr8NX+Osh45/1wzJtJQ8v1yfRFAWZDj3l3USlER03u2oEiozIEttoR25Iags
od47TmBHg8z+gdiEKaS/RKwo5DL/k4eISfbY9OVpMDp78SqWMkQB0rlAc0poiofy
CyMK7uk4jkzjR4WiGsqD+SlRgeNhkEf/HTqvu25UkQKBgQD04jhJbKC625UpzSMX
NkvQGNE9sX3vKU6veqMKVG7dfzZyOYACofhLU2rcJah8wdRu8DK5nymguhhxd/SS
zy9x4tuI/oXjUawSLFB9mYvR3rHZAe+drTqRYojPwu7J0u6/LiscOqg7pU9Cmr36
YtXQqf5qYt4lpajyOPNIusaQ8QKBgQDbkHHVuMXa6feL0MCU79k88E0GkBq6KCRI
KMp8BOl+y2y1CJ8PLufhxdI2Wy1ivTLjL9J7b1HfrBhV1P6mgL9Kf3LBlawfXavD
bWZ9ikpPJp3Um2q2dUixQphRwsrYPrJb6SzIX4yM2CSHbMSQKhiNZFw1r0MIcMEw
TOzKxO8ZzQKBgDvThKLTihT8jl2PA1Kpbi4h0gS7dyPVuKaAVJKye/9bE+cmCxMZ
lPp6H7I29Qm9pPORdSMKMnZU4KHgB31SZqnxHWdDn1wg2OP7tZJpz9HvEQ4OPgcM
ijF4nCn92q6t/KvyUI/t+KnRwiJogZ9JRCldTo2ZJ+KUrUi4Bx+umdJRAoGAZS4u
Vzf77YLuMb80UC4rZPqz9DdKKck/1wT9MqOs2mJyKQbdDckm0JMx6RyhUKQxpCIw
k/NbvoB3Am7SHvarsHAE+RK5LAcllTyAA5BL6Ce6ifRI++YWZqFywhLLGVXjKZnN
qlTl1y3vv3yvJGRRxi6ek5q9gFE9pb19TX/tU20CgYBvALv1H0/EWuQYMupGVVSY
WNNDCeAmFY/cHCa8w5jEUBdm89wSFdITDo5owj3r45TyOreVwoZVxQco7Ceb9Grp
h9ZMrcLysGvGWawYMpBsKAsqndh0BSJgBMRA2RWlfq0dExGXF5kU+DLocZk0Cj7/
bR0IBnsDPTAAn2XNRjJyxQ==
-----END PRIVATE KEY-----
`;

const originalChiaRoot = process.env.CHIA_ROOT;

let tmpRoot: string;
let server: https.Server;
let wss: WebSocketServer;
let connections: WebSocket[];
let receivedMessages: WireMessage[];
let receivedRawMessages: string[];

function writeConfig(port: number) {
  const configDir = path.join(tmpRoot, 'config');
  const sslDir = path.join(configDir, 'ssl', 'daemon');
  fs.mkdirSync(sslDir, { recursive: true });

  fs.writeFileSync(path.join(sslDir, 'private_daemon.crt'), TEST_CERT);
  fs.writeFileSync(path.join(sslDir, 'private_daemon.key'), TEST_KEY);
  fs.writeFileSync(
    path.join(configDir, 'config.yaml'),
    dump({
      ui: {
        daemon_host: 'localhost',
        daemon_port: port,
        daemon_ssl: {
          private_crt: 'config/ssl/daemon/private_daemon.crt',
          private_key: 'config/ssl/daemon/private_daemon.key',
        },
      },
    }),
  );
}

function waitForMessage(command: string): Promise<WireMessage> {
  const existing = receivedMessages.find((message) => message.command === command);
  if (existing) {
    return Promise.resolve(existing);
  }

  return new Promise((resolve) => {
    wss.on('message-recorded', (message: WireMessage) => {
      if (message.command === command) {
        resolve(message);
      }
    });
  });
}

async function startServer(handler?: (socket: WebSocket, message: WireMessage) => void | Promise<void>) {
  server = https.createServer({ key: TEST_KEY, cert: TEST_CERT });
  wss = new WebSocketServer({ server });
  connections = [];
  receivedMessages = [];
  receivedRawMessages = [];

  wss.on('connection', (socket) => {
    connections.push(socket);
    socket.on('message', async (data) => {
      const rawMessage = data.toString();
      receivedRawMessages.push(rawMessage);

      const message = JSONBig.parse(rawMessage) as WireMessage;
      receivedMessages.push(message);
      wss.emit('message-recorded', message);

      if (handler) {
        await handler(socket, message);
        return;
      }

      socket.send(
        JSONBig.stringify({
          request_id: message.request_id,
          data: {
            success: true,
            command: message.command,
          },
        }),
      );
    });
  });

  await new Promise<void>((resolve) => {
    server.listen(0, 'localhost', resolve);
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to bind test daemon');
  }

  writeConfig(address.port);
}

async function stopServer() {
  connections?.forEach((connection) => connection.terminate());
  await new Promise<void>((resolve) => {
    if (!wss) {
      resolve();
      return;
    }
    wss.close(() => resolve());
  });
  await new Promise<void>((resolve) => {
    if (!server) {
      resolve();
      return;
    }
    server.close(() => resolve());
  });
}

function loadSendCommand() {
  return jest.requireActual<typeof import('./sendCommand')>('./sendCommand').sendCommand;
}

beforeEach(() => {
  jest.resetModules();
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'send-command-'));
  process.env.CHIA_ROOT = tmpRoot;
});

afterEach(async () => {
  await stopServer();
  process.env.CHIA_ROOT = originalChiaRoot;
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe('sendCommand', () => {
  it('registers once and reuses the daemon socket for subsequent commands', async () => {
    await startServer();
    const sendCommand = loadSendCommand();

    await expect(sendCommand('get_network_info', 'chia_wallet')).resolves.toMatchObject({
      success: true,
      command: 'get_network_info',
    });
    await expect(sendCommand('get_logged_in_fingerprint', 'chia_wallet')).resolves.toMatchObject({
      success: true,
      command: 'get_logged_in_fingerprint',
    });

    expect(connections).toHaveLength(1);
    expect(receivedMessages.map((message) => message.command)).toEqual([
      'register_service',
      'get_network_info',
      'get_logged_in_fingerprint',
    ]);
  });

  it('routes concurrent responses by request id', async () => {
    const pendingCommands = new Map<string, { socket: WebSocket; message: WireMessage }>();
    await startServer((socket, message) => {
      if (message.command === 'register_service') {
        socket.send(JSONBig.stringify({ request_id: message.request_id, data: { success: true } }));
        return;
      }
      pendingCommands.set(message.command, { socket, message });
    });
    const sendCommand = loadSendCommand();

    const first = sendCommand('first_command', 'chia_wallet');
    const second = sendCommand('second_command', 'chia_wallet');

    await waitForMessage('first_command');
    await waitForMessage('second_command');

    const secondCommand = pendingCommands.get('second_command');
    const firstCommand = pendingCommands.get('first_command');
    if (!secondCommand || !firstCommand) {
      throw new Error('Missing pending command');
    }

    secondCommand.socket.send(
      JSONBig.stringify({ request_id: secondCommand.message.request_id, data: { success: true, value: 'second' } }),
    );
    firstCommand.socket.send(
      JSONBig.stringify({ request_id: firstCommand.message.request_id, data: { success: true, value: 'first' } }),
    );

    await expect(second).resolves.toMatchObject({ value: 'second' });
    await expect(first).resolves.toMatchObject({ value: 'first' });
  });

  it('parses unsafe integer response values as native bigints', async () => {
    await startServer((socket, message) => {
      if (message.command === 'register_service') {
        socket.send(JSONBig.stringify({ request_id: message.request_id, data: { success: true } }));
        return;
      }

      socket.send(`{"request_id":"${message.request_id}","data":{"success":true,"mojos":9007199254740993}}`);
    });
    const sendCommand = loadSendCommand();

    const response = await sendCommand<{ mojos: unknown }>('get_wallet_balance', 'chia_wallet');

    expect(response.mojos).toBe(BigInt('9007199254740993'));
  });

  it('stringifies bigint command values as JSON numbers', async () => {
    await startServer();
    const sendCommand = loadSendCommand();

    await sendCommand('send_bigint', 'chia_wallet', {
      mojos: BigInt('9007199254740993'),
    });
    await waitForMessage('send_bigint');

    const rawMessage = receivedRawMessages.find((message) => message.includes('"command":"send_bigint"'));
    expect(rawMessage).toBeDefined();
    expect(rawMessage).toContain('"mojos":9007199254740993');
    expect(rawMessage).not.toContain('"mojos":"9007199254740993"');
    expect(rawMessage).not.toContain('9007199254740993n');
  });

  it('rejects daemon command errors', async () => {
    await startServer((socket, message) => {
      socket.send(
        JSONBig.stringify({
          request_id: message.request_id,
          data:
            message.command === 'register_service'
              ? { success: true }
              : { success: false, error: 'daemon rejected command' },
        }),
      );
    });
    const sendCommand = loadSendCommand();

    await expect(sendCommand('send_transaction', 'chia_wallet')).rejects.toThrow('daemon rejected command');
  });

  it('rejects an in-flight command when the socket closes and reconnects on the next command', async () => {
    await startServer((socket, message) => {
      if (message.command === 'register_service') {
        socket.send(JSONBig.stringify({ request_id: message.request_id, data: { success: true } }));
        return;
      }
      if (message.command === 'close_me') {
        socket.close();
        return;
      }
      socket.send(JSONBig.stringify({ request_id: message.request_id, data: { success: true, reconnected: true } }));
    });
    const sendCommand = loadSendCommand();

    await expect(sendCommand('close_me', 'chia_wallet')).rejects.toThrow('Connection closed before receiving response');
    await expect(sendCommand('after_close', 'chia_wallet')).resolves.toMatchObject({ reconnected: true });

    expect(connections).toHaveLength(2);
  });
});

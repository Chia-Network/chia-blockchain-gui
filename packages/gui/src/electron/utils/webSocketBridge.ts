import { type WebContents } from 'electron';
import crypto from 'node:crypto';

import JSONbig from 'json-bigint';
import WebSocket, { type RawData } from 'ws';

import WebSocketAPI from '../constants/WebSocketAPI';

import ipcMainHandle from './ipcMainHandle';
import loadConfig from './loadConfig';

const connections: Record<string, WebSocket> = {};

// Pending dapp request_id → response promise. Populated by `sendDappAndAwait`
// and resolved from the shared `socket.on('message')` listener so dapp
// responses don't need a separate WebSocket subscription. Only request_ids
// minted here ever end up in this map; the renderer's Client uses its own
// (different) request_ids and is unaffected.
const dappPending = new Map<string, { resolve: (value: unknown) => void; reject: (reason: Error) => void }>();

function getConnection(id: string) {
  const connection = connections[id];
  if (!connection) {
    throw new Error(`WebSocketConnection ${id} not found`);
  }
  return connection;
}

export function getPrimaryConnection(): WebSocket {
  const list = Object.values(connections);
  if (list.length === 0) {
    throw new Error('No active WebSocket connection');
  }
  return list[0];
}

/**
 * Send `payload` (already JSON-encoded) on the primary connection and resolve
 * with the parsed response whose `request_id` matches `requestId`. The caller
 * is responsible for putting `request_id` into the payload so the daemon
 * echoes it back. Rejects after `timeoutMs`.
 */
export function sendDappAndAwait(requestId: string, payload: string, timeoutMs = 60_000): Promise<unknown> {
  const conn = getPrimaryConnection();
  return new Promise<unknown>((resolve, reject) => {
    const timer = setTimeout(() => {
      if (dappPending.delete(requestId)) {
        reject(new Error(`Dapp request ${requestId} timed out after ${timeoutMs}ms`));
      }
    }, timeoutMs);
    dappPending.set(requestId, {
      resolve: (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      reject: (reason) => {
        clearTimeout(timer);
        reject(reason);
      },
    });
    conn.send(payload);
  });
}

// Function to clean up all WebSocket connections
function cleanupConnections() {
  Object.entries(connections).forEach(([id, connection]) => {
    try {
      connection.close();
    } catch (err) {
      console.error(`Error closing WebSocket connection ${id}:`, err);
    }
  });
}

export default function bindEvents(
  webContents: WebContents,
  options: {
    net?: string;
    onSend?: (id: string, data: string) => Promise<void>;
    onReceive?: (id: string, data: RawData) => Promise<void>;
  },
) {
  const { net, onSend, onReceive } = options;

  function notifyWebContents(events: string, ...args: any[]) {
    if (webContents.isDestroyed()) {
      return;
    }

    webContents.send(events, ...args);
  }

  // Add event listener for when web contents are being destroyed
  webContents.on('destroyed', () => {
    cleanupConnections();
  });

  ipcMainHandle(WebSocketAPI.CONNECT, async () => {
    const id = crypto.randomUUID();

    const { url, key, cert } = await loadConfig(net);

    const socket = new WebSocket(url, {
      key,
      cert,
      rejectUnauthorized: false,
    });

    socket.on('open', () => {
      notifyWebContents(WebSocketAPI.ON_OPEN, id);
    });

    socket.on('message', async (data, isBinary) => {
      // If this response matches a pending dapp request, resolve here and
      // don't notify the renderer. Renderer's Client never minted this
      // request_id, so forwarding would just produce noise.
      try {
        const parsed = JSONbig.parse(data.toString());
        const requestId = typeof parsed?.request_id === 'string' ? parsed.request_id : undefined;
        if (requestId) {
          const pending = dappPending.get(requestId);
          if (pending) {
            dappPending.delete(requestId);
            pending.resolve(parsed);
            return;
          }
        }
      } catch {
        // Fall through — non-JSON or malformed messages still flow to the
        // renderer's existing handler.
      }

      if (!onReceive) {
        notifyWebContents(WebSocketAPI.ON_MESSAGE, id, data, isBinary);
        return;
      }

      try {
        await onReceive(id, data);
        notifyWebContents(WebSocketAPI.ON_MESSAGE, id, data, isBinary);
      } catch (err) {
        console.error(err);

        const parsedMessage = JSON.parse(data.toString());

        if (parsedMessage.request_id) {
          notifyWebContents(
            WebSocketAPI.ON_MESSAGE,
            id,
            JSON.stringify({
              request_id: parsedMessage.request_id,
              data: {
                error: (err as Error).message,
              },
            }),
          );
        }
      }
    });

    socket.on('error', (err) => {
      notifyWebContents(WebSocketAPI.ON_ERROR, id, err.message);
    });

    socket.on('close', (code) => {
      socket.removeAllListeners();

      notifyWebContents(WebSocketAPI.ON_CLOSE, id, code);
      delete connections[id];
    });

    connections[id] = socket;

    return id;
  });

  ipcMainHandle(WebSocketAPI.SEND, async (id: string, data: string) => {
    const connection = getConnection(id);

    if (!onSend) {
      connection.send(data);
      return;
    }

    try {
      await onSend(id, data);
      connection.send(data);
    } catch (err) {
      console.error(err);

      const parsedMessage = JSON.parse(data);

      if (parsedMessage.request_id) {
        notifyWebContents(
          WebSocketAPI.ON_MESSAGE,
          id,
          JSON.stringify({
            request_id: parsedMessage.request_id,
            data: {
              error: (err as Error).message,
            },
          }),
        );
      }
    }
  });

  ipcMainHandle(WebSocketAPI.CLOSE, (id: string) => {
    const connection = getConnection(id);
    connection.close();
  });
}

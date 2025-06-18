import { type WebContents } from 'electron';
import crypto from 'node:crypto';

import WebSocket, { type RawData } from 'ws';

import WebSocketAPI from '../constants/WebSocketAPI';

import ipcMainHandle from './ipcMainHandle';
import loadConfig from './loadConfig';

const connections: Record<string, WebSocket> = {};

function getConnection(id: string) {
  const connection = connections[id];
  if (!connection) {
    throw new Error(`WebSocketConnection ${id} not found`);
  }
  return connection;
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
      webContents.send(WebSocketAPI.ON_OPEN, id);
    });

    socket.on('message', async (data, isBinary) => {
      if (!onReceive) {
        webContents.send(WebSocketAPI.ON_MESSAGE, id, data, isBinary);
        return;
      }

      try {
        await onReceive(id, data);
        webContents.send(WebSocketAPI.ON_MESSAGE, id, data, isBinary);
      } catch (err) {
        console.error(err);

        const parsedMessage = JSON.parse(data.toString());

        if (parsedMessage.request_id) {
          webContents.send(
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
      webContents.send(WebSocketAPI.ON_ERROR, id, err.message);
    });

    socket.on('close', (code) => {
      socket.removeAllListeners();

      webContents.send(WebSocketAPI.ON_CLOSE, id, code);
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
        webContents.send(
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

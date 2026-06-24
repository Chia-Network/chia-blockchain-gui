import JSONBig from 'json-bigint';
import { WebSocket } from 'ws';

import { loadConfig } from '../utils/loadConfig';

const REQUEST_TIMEOUT_MS = 10 * 60 * 1000;
const JSONBigNative = JSONBig({ useNativeBigInt: true });

let socketPromise: Promise<WebSocket> | undefined;

async function connect(): Promise<WebSocket> {
  if (socketPromise) {
    return socketPromise;
  }

  const connectPromise = new Promise<WebSocket>(async (resolve, reject) => {
    let isResolved = false;

    const { url, key, cert } = await loadConfig();

    const socket = new WebSocket(url, {
      key,
      cert,
      rejectUnauthorized: false,
    });

    const requestId = crypto.randomUUID();

    const registerService = JSON.stringify({
      request_id: requestId,
      command: 'register_service',
      data: { service: 'wallet_ui' },
      origin: 'wallet_ui',
      destination: 'daemon',
      ack: false,
    });

    function handleMessage(data: Buffer) {
      try {
        const response = JSONBigNative.parse(data.toString());
        if (response.request_id !== requestId) {
          return;
        }

        if (!response.data.success) {
          throw new Error(`Daemon service is not registered`);
        }

        handleSuccess(socket);
      } catch (error) {
        handleError(new Error((error as Error).message));
      }
    }

    function handleSocketError(error: Error) {
      handleError(error);
    }

    function handleSocketClose() {
      handleError(new Error('Connection closed before receiving response'));
    }

    function handleConnectedSocketClose() {
      if (connectPromise === socketPromise) {
        socketPromise = undefined;
      }
    }

    function handleError(error: Error) {
      // always disconnect and close socket
      socket.removeAllListeners();
      socket.close();

      // clear current socket promise if it used for future requests, because socket is not valid anymore
      if (connectPromise === socketPromise) {
        socketPromise = undefined;
      }

      // reject only during initial connection
      // when connection was successful, next requests will use new socket and create new socketPromise
      if (!isResolved) {
        reject(error);
      }
    }

    function handleSuccess(connectedSocket: WebSocket) {
      if (isResolved) {
        return;
      }

      socket.removeListener('message', handleMessage);
      socket.removeListener('error', handleSocketError);
      socket.removeListener('close', handleSocketClose);

      socket.on('error', handleConnectedSocketClose);
      socket.on('close', handleConnectedSocketClose);

      isResolved = true;

      resolve(connectedSocket);
    }

    socket.on('open', () => {
      socket.on('message', handleMessage);
      socket.send(registerService);
    });

    socket.on('error', handleSocketError);
    socket.on('close', handleSocketClose);
  });

  socketPromise = connectPromise;

  return socketPromise;
}

export async function sendCommand<TResponse extends Record<string, unknown>>(
  command: string,
  destination: 'daemon' | 'chia_wallet' | string,
  commandData?: Record<string, unknown>,
): Promise<TResponse> {
  return new Promise<TResponse>(async (resolveMessage, rejectMessage) => {
    let isDone = false;

    const requestId = crypto.randomUUID();

    const timeout = setTimeout(() => {
      handleReject(new Error(`The request ${requestId} timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds.`));
    }, REQUEST_TIMEOUT_MS);

    const socket = await connect();

    function cleanup() {
      clearTimeout(timeout);
      socket.removeListener('message', handleMessage);
      socket.removeListener('error', handleSocketError);
      socket.removeListener('close', handleSocketClose);
    }

    function handleSocketError(error: Error) {
      handleReject(error);
    }
    function handleSocketClose() {
      handleReject(new Error('Connection closed before receiving response'));
    }

    function handleResolve(data: TResponse) {
      if (isDone) {
        return;
      }

      isDone = true;
      cleanup();
      resolveMessage(data);
    }

    function handleReject(error: Error) {
      if (isDone) {
        return;
      }

      isDone = true;
      cleanup();
      rejectMessage(error);
    }

    function handleMessage(data: Buffer) {
      try {
        const response = JSONBigNative.parse(data.toString());
        if (response.request_id !== requestId) {
          return;
        }

        if (!response.data.success) {
          throw new Error(response.data.error);
        }

        handleResolve(response.data);
      } catch (error) {
        handleReject(new Error((error as Error).message));
      }
    }

    socket.on('message', handleMessage);
    socket.on('error', handleSocketError);
    socket.on('close', handleSocketClose);

    try {
      const messageData = JSONBigNative.stringify({
        request_id: requestId,
        command,
        destination,
        origin: 'wallet_ui',
        data: commandData,
        ack: false,
      });

      socket.send(messageData);
    } catch (error) {
      handleReject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}

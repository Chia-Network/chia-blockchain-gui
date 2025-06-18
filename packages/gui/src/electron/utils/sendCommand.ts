import { WebSocket } from 'ws';

import loadConfig from './loadConfig';

export default async function sendCommand<TResponse extends Record<string, any>>(
  command: string,
  destination: 'daemon' | 'chia_wallet',
  commandData?: Record<string, string>,
): Promise<TResponse> {
  const { url, key, cert } = await loadConfig();

  const socket = new WebSocket(url, {
    key,
    cert,
    rejectUnauthorized: false,
  });

  const requestId = crypto.randomUUID();

  const messageData = JSON.stringify({
    request_id: requestId,
    command,
    destination,
    origin: 'wallet_ui',
    data: commandData,
    ack: false,
  });

  return new Promise((resolve, reject) => {
    let isResolved = false;

    function cleanup() {
      if (!isResolved) {
        socket.removeAllListeners();
        socket.close();
      }
    }

    function handleSuccess(data: any) {
      cleanup();
      isResolved = true;
      resolve(data);
    }

    function handleError(error: Error) {
      cleanup();
      isResolved = true;
      reject(error);
    }

    socket.on('open', () => {
      const registerService = JSON.stringify({
        command: 'register_service',
        data: { service: 'wallet_ui' },
        origin: 'wallet_ui',
        destination: 'daemon',
        ack: false,
      });

      socket.send(registerService);

      socket.once('message', (data: Buffer) => {
        try {
          const response = JSON.parse(data.toString());
          if (!response.data.success) {
            throw new Error(`Service ${destination} is not registered`);
          }

          socket.send(messageData);
        } catch (error) {
          handleError(new Error((error as Error).message));
        }
      });
    });

    socket.on('message', (data: Buffer) => {
      try {
        const response = JSON.parse(data.toString());
        if (response.request_id !== requestId) {
          return;
        }

        if (!response.data.success) {
          throw new Error(response.data.error);
        }

        handleSuccess(response.data);
      } catch (error) {
        handleError(new Error('Failed to parse response'));
      }
    });

    socket.on('error', (error: Error) => {
      handleError(error);
    });

    socket.on('close', () => {
      if (!isResolved) {
        handleError(new Error('Connection closed before receiving response'));
      }
    });
  });
}

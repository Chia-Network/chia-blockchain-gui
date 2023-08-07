import EventEmitter from 'events';

import debug from 'debug';

import type Response from './@types/Response';
import Message from './Message';
import ConnectionState from './constants/ConnectionState';
import ServiceName, { type ServiceNameValue } from './constants/ServiceName';
import Daemon from './services/Daemon';
import ErrorData from './utils/ErrorData';
import sleep from './utils/sleep';

const log = debug('chia-api:client');

type Options = {
  url: string;
  cert: string;
  key: string;
  webSocket: any;
  services?: ServiceNameValue[];
  timeout?: number;
  camelCase?: boolean;
  debug?: boolean;
};

export default class Client extends EventEmitter {
  static isClient = true;

  private options: Required<Options>;

  private ws: any;

  private connected = false;

  private requests: Map<
    string,
    {
      resolve: (value: Message) => void;
      reject: (reason: Error) => void;
    }
  > = new Map();

  private connectedPromise: Promise<void> | null = null;

  private connectedPromiseResponse: { resolve: any; reject: any } | null = null;

  readonly daemon: Daemon;

  private closed = false;

  private state: ConnectionState = ConnectionState.DISCONNECTED;

  private reconnectAttempt = 0;

  constructor(options: Options) {
    super();

    this.setMaxListeners(100);

    this.options = {
      timeout: 60 * 1000 * 10, // 10 minutes
      camelCase: true,
      debug: false,
      services: [],
      ...options,
    };

    const { url } = this.options;
    if (!url.startsWith('wss://')) {
      throw new Error('You need to use wss (WebSocket Secure) protocol');
    }

    this.daemon = new Daemon(this);

    if (this.options.services.length) {
      this.connect();
    }
  }

  getState(): {
    state: ConnectionState;
    attempt: number;
  } {
    return {
      state: this.state,
      attempt: this.reconnectAttempt,
    };
  }

  private changeState(state: ConnectionState) {
    log(`Connection state changed: ${state}`);
    if (state === ConnectionState.CONNECTING && state === this.state) {
      this.reconnectAttempt += 1;
      log(`Reconnect attempt ${this.reconnectAttempt}`);
    } else {
      this.reconnectAttempt = 0;
    }

    this.state = state;
    this.emit('state', this.getState());
  }

  onStateChange(callback: (state: { state: ConnectionState; attempt: number }) => void) {
    this.on('state', callback);

    return () => {
      this.off('state', callback);
    };
  }

  get origin() {
    return ServiceName.EVENTS;
  }

  get debug(): boolean {
    return this.options.debug;
  }

  async connect(reconnect?: boolean) {
    if (this.closed) {
      log('Client is permanently closed');
      return undefined;
    }

    if (this.connectedPromise && !reconnect) {
      return this.connectedPromise;
    }

    const { url, key, cert, webSocket: WebSocket } = this.options;

    if (!url) {
      throw new Error('Url is not defined');
    } else if (!key) {
      throw new Error('Key is not defined');
    } else if (!cert) {
      throw new Error('Cert is not defined');
    } else if (!WebSocket) {
      throw new Error('WebSocket is not defined');
    }

    this.changeState(ConnectionState.CONNECTING);

    log(`Connecting to ${url}`);

    const ws = new WebSocket(url, {
      key,
      cert,
      rejectUnauthorized: false,
    });

    if (!reconnect) {
      this.connectedPromise = new Promise((resolve, reject) => {
        this.connectedPromiseResponse = {
          resolve,
          reject,
        };
      });
    }

    ws.on('open', this.handleOpen);
    ws.on('close', this.handleClose);
    ws.on('error', this.handleError);
    ws.on('message', this.handleMessage);

    this.ws = ws;

    return this.connectedPromise;
  }

  private handleOpen = async () => {
    this.connected = true;

    // todo clear deamon running services because it has old state
    this.emit('state', this.getState());

    this.changeState(ConnectionState.CONNECTED);

    await this.registerService(ServiceName.EVENTS);

    if (this.connectedPromiseResponse) {
      this.connectedPromiseResponse.resolve();
      this.connectedPromiseResponse = null;
    }
  };

  registerService(serviceName: ServiceNameValue) {
    return this.daemon.registerService({ service: serviceName });
  }

  private handleClose = () => {
    this.connected = false;
    this.connectedPromise = null;

    this.requests.forEach((request) => {
      request.reject(new Error(`Connection closed`));
    });
  };

  private handleError = async () => {
    if (this.connectedPromiseResponse) {
      await sleep(1000);
      this.connect(true);
    }
  };

  private handleMessage = (data: string) => {
    const {
      options: { camelCase },
    } = this;

    log('Received message', data.toString());
    const message = <Message & { data: Response }>Message.fromJSON(data, camelCase);

    const { requestId } = message;

    const request = this.requests.get(requestId);
    if (request) {
      const { resolve, reject } = request;
      this.requests.delete(requestId);

      if (message.data?.error) {
        let errorMessage = message.data.error;

        if (errorMessage === '13') {
          errorMessage =
            '[Error 13] Permission denied. You are trying to access a file/directory without having the necessary permissions. Most likely one of the plot folders in your config.yaml has an issue.';
        } else if (errorMessage === '22') {
          errorMessage =
            '[Error 22] File not found. Most likely one of the plot folders in your config.yaml has an issue.';
        } else if (message?.data?.errorDetails?.message) {
          errorMessage = `${errorMessage}: ${message.data.errorDetails.message}`;
        }

        log(`Request ${requestId} rejected`, errorMessage);

        reject(new ErrorData(errorMessage, message.data));
        return;
      }

      if (message.data?.success !== true) {
        log(`Request ${requestId} rejected`, 'Unknown error message');
        reject(new ErrorData(`Request ${requestId} failed: ${JSON.stringify(message.data)}`, message.data));
        return;
      }

      resolve(message);
    } else {
      // other messages can be events like get_harvesters
      this.emit('message', message);
    }
  };

  async send(message: Message, timeout?: number, disableFormat?: boolean): Promise<Message> {
    const {
      connected,
      options: { timeout: defaultTimeout, camelCase },
    } = this;

    const currentTimeout = timeout ?? defaultTimeout;
    const serviceName = message.destination;

    if (!connected) {
      log('API is not connected trying to connect');
      await this.connect();
    }

    if (serviceName !== ServiceName.DAEMON && message.command !== 'ping') {
      // when client was closed we need to wait for new connection
      if (this.closed) {
        await new Promise((resolve) => {
          // wait for connected event
          const handleStateChange = (state: { state: ConnectionState }) => {
            if (state.state === ConnectionState.CONNECTED) {
              this.off('state', handleStateChange);
              resolve(undefined);
            }
          };

          this.on('state', handleStateChange);
        });
      }

      // verify if service is started
      const isStarted = await this.daemon.isServiceStarted(serviceName);
      if (!isStarted) {
        await this.daemon.waitForKeyringUnlocked();
        await this.daemon.startService({ service: serviceName });
      }
    }

    return new Promise((resolve, reject) => {
      const { requestId } = message;

      this.requests.set(requestId, { resolve, reject });
      const value = message.toJSON(camelCase && !disableFormat);
      log('Sending message', value);

      this.ws.send(value);

      if (currentTimeout) {
        setTimeout(() => {
          if (this.requests.has(requestId)) {
            this.requests.delete(requestId);

            reject(
              new ErrorData(`The request ${requestId} has timed out ${currentTimeout / 1000} seconds.`, undefined)
            );
          }
        }, currentTimeout);
      }
    });
  }

  async close(args: { force?: boolean }) {
    const { force = false } = args;
    if (force) {
      this.closed = true;
    }

    if (!this.connected) {
      return;
    }

    await this.daemon.stopAllServices();

    await this.daemon.exit();

    this.ws.close();
    this.changeState(ConnectionState.DISCONNECTED);
  }
}

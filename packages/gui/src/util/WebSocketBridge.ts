import { EventEmitter } from 'events';

export type Principal = { kind: 'ui' } | { kind: 'pair'; topic: string };

export type SendOptions = {
  /**
   * When set, the call is tagged with this principal at the IPC boundary so
   * main can resolve permissions against the right pair (or default to UI when
   * absent). Passed explicitly per-call — there is no ambient context, because
   * async work between push and pop on a shared stack would let unrelated UI
   * polls inherit a dapp's principal.
   */
  principal?: Principal;
};

export default class WebSocketBridge extends EventEmitter {
  private id: string | undefined;

  constructor(url: string, options: { key: string; cert: string; rejectUnauthorized: boolean }) {
    super();

    this.connect(url, options);
  }

  private async connect(_url: string, _options: { key: string; cert: string; rejectUnauthorized: boolean }) {
    try {
      // we read all information from the config file
      this.id = await window.webSocketAPI.connect();

      const unsubscribeOpen = window.webSocketAPI.subscribeToOpen((id) => {
        if (id === this.id) {
          this.emit('open');
        }
      });

      const unsubscribeMessage = window.webSocketAPI.subscribeToMessage((id, data) => {
        if (id === this.id) {
          const message =
            typeof data === 'string'
              ? data
              : new TextDecoder().decode(data instanceof ArrayBuffer ? new Uint8Array(data) : data);
          this.emit('message', message);
        }
      });

      const unsubscribeError = window.webSocketAPI.subscribeToError((id, error) => {
        if (id === this.id) {
          this.emit('error', new Error(error));
        }
      });

      const unsubscribeClose = window.webSocketAPI.subscribeToClose((id, code) => {
        if (id === this.id) {
          unsubscribeOpen();
          unsubscribeMessage();
          unsubscribeError();
          unsubscribeClose();

          this.emit('close', code);
        }
      });
    } catch (error) {
      console.error('WebSocketBridge: constructor error', error);
    }
  }

  send(data: string, options?: SendOptions) {
    if (!this.id) {
      throw new Error('WebSocketBridge: wait for connection to be established');
    }
    const metadata = options?.principal ? { principal: options.principal } : undefined;
    window.webSocketAPI.send(this.id, data, metadata);
  }

  close() {
    if (!this.id) {
      throw new Error('WebSocketBridge: wait for connection to be established');
    }
    window.webSocketAPI.close(this.id);
  }
}

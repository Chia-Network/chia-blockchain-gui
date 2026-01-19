import { EventEmitter } from 'events';

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

  send(data: string) {
    if (!this.id) {
      throw new Error('WebSocketBridge: wait for connection to be established');
    }
    window.webSocketAPI.send(this.id, data);
  }

  close() {
    if (!this.id) {
      throw new Error('WebSocketBridge: wait for connection to be established');
    }
    window.webSocketAPI.close(this.id);
  }
}

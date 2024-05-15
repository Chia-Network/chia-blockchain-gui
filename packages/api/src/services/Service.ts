import EventEmitter from 'events';

import { isUndefined, omitBy } from 'lodash';

import type Client from '../Client';
import Message from '../Message';
import { type ServiceNameValue } from '../constants/ServiceName';

export type Options = {
  origin?: ServiceNameValue;
};

export default abstract class Service extends EventEmitter {
  readonly client: Client;

  readonly name: ServiceNameValue;

  readonly origin: ServiceNameValue;

  #readyPromise: Promise<null> | undefined;

  constructor(name: ServiceNameValue, client: Client, options: Options = {}, onInit?: () => Promise<void>) {
    super();

    const { origin } = options;

    this.client = client;
    this.name = name;
    this.origin = origin ?? client.origin;

    this.setMaxListeners(100);

    client.on('message', this.handleMessage);

    this.#readyPromise = new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          if (onInit) {
            await onInit();
          }
          resolve(null);
        } catch (error: any) {
          reject(error);
        }
      });
    });
  }

  async whenReady(callback?: () => Promise<any>) {
    await this.#readyPromise;
    if (callback) {
      return callback();
    }
    return undefined;
  }

  register() {
    return this.client.registerService(this.name);
  }

  handleMessage = (message: Message) => {
    if (message.origin !== this.name) {
      return;
    }

    this.processMessage(message);
  };

  processMessage(message: Message) {
    if (message.command) {
      this.emit(message.command, message.data, message);
    }
  }

  async command<Data>(
    command: string,
    data: Object = {},
    ack = false,
    timeout?: number,
    disableFormat?: boolean,
  ): Promise<Data> {
    const { client, origin, name } = this;

    if (!command) {
      throw new Error('Command is required parameter');
    }

    // remove undefined values from root data
    const updatedData = omitBy(data, isUndefined);

    const response = await client.send(
      new Message({
        origin,
        destination: name,
        command,
        data: updatedData,
        ack,
      }),
      timeout,
      disableFormat,
    );

    return response?.data as Data;
  }

  async ping() {
    return this.command<void>('ping', undefined, undefined, 1000);
  }

  onCommand(
    command: string,
    callback: (data: any, message: Message) => void,
    processData?: (data: any, message: Message) => any,
  ): () => void {
    function handleCommand(data: any, message: Message) {
      const updatedData = processData ? processData(data, message) : data;
      callback(updatedData, message);
    }

    this.on(command, handleCommand);

    return () => {
      this.off(command, handleCommand);
    };
  }

  onStateChanged(state: string, callback: (data: any, message: Message) => void, processData?: (data: any) => any) {
    return this.onCommand(
      'state_changed',
      (data, message) => {
        if (data.state === state) {
          callback(data, message);
        }
      },
      processData,
    );
  }
}

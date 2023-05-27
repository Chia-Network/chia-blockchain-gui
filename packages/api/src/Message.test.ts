import { randomBytes } from 'crypto';

import type MessageInterface from './@types/MessageInterface';
import Message from './Message';
import { ServiceNameValue } from './constants';

jest.mock('crypto', () => ({
  randomBytes: jest.fn(),
}));

describe('Message', () => {
  beforeEach(() => {
    (randomBytes as any).mockReset();
  });

  describe('constructor', () => {
    it('should create a new Message instance', () => {
      const options = {
        command: 'test',
        origin: 'test',
        destination: 'test',
        data: { test: 'test' },
        ack: true,
        requestId: 'test',
      };
      const message = new Message(options as any);
      expect(message.command).toEqual(options.command);
      expect(message.origin).toEqual(options.origin);
      expect(message.destination).toEqual(options.destination);
      expect(message.data).toEqual(options.data);
      expect(message.ack).toEqual(options.ack);
      expect(message.requestId).toEqual(options.requestId);
    });

    it('should set a random requestId if none is provided', () => {
      const options: MessageInterface = {
        command: 'test',
        origin: 'test' as ServiceNameValue,
        destination: 'test' as ServiceNameValue,
        data: { test: 'test' },
        ack: true,
      };
      (randomBytes as any).mockReturnValueOnce(Buffer.from('test'));
      const message = new Message(options);
      expect(message.requestId).toEqual('74657374');
    });
  });

  describe('toJSON', () => {
    it('should return a JSON string with original keys if useSnakeCase is false', () => {
      const options: MessageInterface = {
        command: 'test',
        origin: 'test' as ServiceNameValue,
        destination: 'test' as ServiceNameValue,
        data: { testKey: 'test', test_key: 'test', TestKey: 'test' },
        ack: true,
        requestId: 'test',
      };
      const message = new Message(options);
      const json = message.toJSON(false);
      expect(json).toEqual(
        '{"command":"test","data":{"testKey":"test","test_key":"test","TestKey":"test"},"origin":"test","destination":"test","ack":true,"request_id":"test"}'
      );
    });

    it('should return a JSON string with snake_case keys if useSnakeCase is true', () => {
      const options: MessageInterface = {
        command: 'test',
        origin: 'test' as ServiceNameValue,
        destination: 'test' as ServiceNameValue,
        data: { testKey: 'test', testKey1: 'test', testKey2: 'test' },
        ack: true,
        requestId: 'test',
      };
      const message = new Message(options);
      const json = message.toJSON(true);
      expect(json).toEqual(
        '{"command":"test","data":{"test_key":"test","test_key_1":"test","test_key_2":"test"},"origin":"test","destination":"test","ack":true,"request_id":"test"}'
      );
    });

    it('should use default value for data if none is provided', () => {
      const options: MessageInterface = {
        command: 'test',
        origin: 'test' as ServiceNameValue,
        destination: 'test' as ServiceNameValue,
        ack: true,
        requestId: 'test',
      };
      const message = new Message(options);
      const json = message.toJSON(true);
      expect(json).toEqual(
        '{"command":"test","data":{},"origin":"test","destination":"test","ack":true,"request_id":"test"}'
      );
    });

    it('should use default value for ack if none is provided', () => {
      const options: MessageInterface = {
        command: 'test',
        origin: 'test' as ServiceNameValue,
        destination: 'test' as ServiceNameValue,
        data: { testKey: 'test' },
        requestId: 'test',
      };
      const message = new Message(options);
      const json = message.toJSON(true);
      expect(json).toEqual(
        '{"command":"test","data":{"test_key":"test"},"origin":"test","destination":"test","ack":false,"request_id":"test"}'
      );
    });
  });

  describe('fromJSON', () => {
    it('should return a new Message instance from a JSON string with camelCase keys if useCamelCase is true', () => {
      const json =
        '{"command":"test","data":{"test_key":"test"},"origin":"test","destination":"test","ack":true,"requestId":"test"}';
      (randomBytes as any).mockReturnValueOnce(Buffer.from('test'));
      const message = Message.fromJSON(json, true);
      expect(message.command).toEqual('test');
      expect(message.origin).toEqual('test');
      expect(message.destination).toEqual('test');
      expect(message.data).toEqual({ testKey: 'test' });
      expect(message.ack).toEqual(true);
      expect(message.requestId).toEqual('74657374'); // 'test' in hex
    });

    it('should return a new Message instance from a JSON string with original keys if useCamelCase is false', () => {
      const json =
        '{"command":"test","data":{"test":"test","test_key":"test","testKey":"test"},"origin":"test","destination":"test","ack":true,"request_id":"test"}';
      const message = Message.fromJSON(json, false);
      expect(message.command).toEqual('test');
      expect(message.origin).toEqual('test');
      expect(message.destination).toEqual('test');
      expect(message.data).toEqual({ test: 'test', test_key: 'test', testKey: 'test' });
      expect(message.ack).toEqual(true);
      expect(message.requestId).toEqual('test');
    });
  });
});

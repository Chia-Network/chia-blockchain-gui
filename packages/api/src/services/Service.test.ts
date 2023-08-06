import { randomBytes } from 'crypto';

import Message from '../Message';
import { ServiceNameValue } from '../constants/ServiceName';
import Service from './Service';

jest.mock('crypto', () => ({
  randomBytes: jest.fn(),
}));

class TestService extends Service {
  constructor(client: any, options: any) {
    super('test_service' as ServiceNameValue, client, options);
  }
}

describe('Service', () => {
  let service: Service;
  let client: any;

  beforeEach(() => {
    (randomBytes as any).mockReset();

    client = {
      origin: 'test_origin',
      on: jest.fn(),
      send: jest.fn(),
    };
    service = new TestService(client, {});
  });

  it('throws if command is not provided', async () => {
    expect.assertions(1);
    try {
      // @ts-ignore TS2554: Testing invalid params case
      await service.command();
    } catch (e: any) {
      expect(e.message).toEqual('Command is required parameter');
    }
  });

  it('throws if command is empty string', async () => {
    expect.assertions(1);
    try {
      await service.command('');
    } catch (e: any) {
      expect(e.message).toEqual('Command is required parameter');
    }
  });

  it('sends command to client', async () => {
    (randomBytes as any).mockReturnValue(Buffer.from('test'));

    const command = 'test_command';
    const data = { test: 'test', testKey1: 'test', testKey2: 'test' };
    const expected = [
      new Message({
        command,
        data,
        destination: 'test_service' as ServiceNameValue,
        origin: 'test_origin' as ServiceNameValue,
      }),
      undefined,
      undefined,
    ];

    await service.command(command, data);
    expect(client.send).toHaveBeenCalledWith(...expected);
  });
});

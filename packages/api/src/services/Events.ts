import Client from '../Client';
import ServiceName from '../constants/ServiceName';

import Service from './Service';
import type { Options } from './Service';

export default class Events extends Service {
  constructor(client: Client, options?: Options) {
    super(ServiceName.EVENTS, client, options);
  }
}

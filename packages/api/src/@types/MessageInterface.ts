import { type ServiceNameValue } from '../constants/ServiceName';

export default interface MessageInterface {
  command: string;
  data?: Object;
  origin: ServiceNameValue;
  destination: ServiceNameValue;
  ack?: boolean;
  requestId?: string;
}

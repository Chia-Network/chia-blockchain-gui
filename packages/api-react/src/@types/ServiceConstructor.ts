export default interface ServiceConstructor {
  new (...args: any[]): any;
  isClient?: boolean;
  isDaemon?: boolean;
}

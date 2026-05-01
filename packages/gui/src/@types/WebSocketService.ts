export type WebSocketSendMetadata = {
  principal?: { kind: 'ui' } | { kind: 'pair'; topic: string };
};

type WebSocketService = {
  connect: () => Promise<string>; // returns connection ID
  send: (connectionId: string, data: string, metadata?: WebSocketSendMetadata) => Promise<void>;
  close: (connectionId: string) => void;

  subscribeToOpen: (callback: (connectionId: string) => void) => () => void;
  subscribeToMessage: (callback: (connectionId: string, data: any) => void) => () => void;
  subscribeToError: (callback: (connectionId: string, error: string) => void) => () => void;
  subscribeToClose: (callback: (connectionId: string, code: number) => void) => () => void;
};

export default WebSocketService;

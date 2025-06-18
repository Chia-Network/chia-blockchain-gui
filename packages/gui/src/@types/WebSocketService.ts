type WebSocketService = {
  connect: () => string; // returns connection ID
  send: (connectionId: string, data: string) => void;
  close: (connectionId: string) => void;

  subscribeToOpen: (callback: (connectionId: string) => void) => () => void;
  subscribeToMessage: (callback: (connectionId: string, data: any) => void) => () => void;
  subscribeToError: (callback: (connectionId: string, error: string) => void) => () => void;
  subscribeToClose: (callback: (connectionId: string, code: number) => void) => () => void;
};

export default WebSocketService;

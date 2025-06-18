import API from './API';

enum WebSocketAPI {
  CONNECT = `${API.WEBSOCKET}:connect`,
  CLOSE = `${API.WEBSOCKET}:close`,
  SEND = `${API.WEBSOCKET}:send`,
  ON_OPEN = `${API.WEBSOCKET}:onOpen`,
  ON_MESSAGE = `${API.WEBSOCKET}:onMessage`,
  ON_ERROR = `${API.WEBSOCKET}:onError`,
  ON_CLOSE = `${API.WEBSOCKET}:onClose`,
}
export default WebSocketAPI;

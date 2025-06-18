import API from './API';

enum ChiaLogsAPI {
  GET_CONTENT = `${API.CHIA_LOGS}:getContent`,
  GET_INFO = `${API.CHIA_LOGS}:getInfo`,
  SET_PATH = `${API.CHIA_LOGS}:setPath`,
}

export default ChiaLogsAPI;

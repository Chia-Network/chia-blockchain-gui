import { get } from 'lodash';

import { readConfigFile } from './loadConfig';

export default function manageDaemonLifetime(net?: string): boolean {
  try {
    const config = readConfigFile(net);
    const selfHostname = get(config, 'self_hostname', 'localhost');
    const uiDaemonHost = get(config, 'ui.daemon_host', 'localhost');

    return selfHostname === uiDaemonHost;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // configuration file does not exists, use default value
      return true;
    }
    throw error;
  }
}

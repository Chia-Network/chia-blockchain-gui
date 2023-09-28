import fs from 'fs';
import os from 'os';
import path from 'path';

import yaml from 'js-yaml';
import { get } from 'lodash';

import sleep from './sleep';
import untildify from './untildify';

export function getConfigRootDir(net = 'mainnet'): string {
  const homedir = os.homedir();

  return 'CHIA_ROOT' in process.env ? untildify(process.env.CHIA_ROOT) : path.join(homedir, '.chia', net);
}

export function readConfigFile(net?: string): string {
  const configRootDir = getConfigRootDir(net);

  return yaml.load(fs.readFileSync(path.resolve(configRootDir, 'config/config.yaml'), 'utf8'));
}

export function getLogPath(net?: string): string {
  const config = readConfigFile(net);
  return get(config, 'logging.log_filename', '/log');
}

export function getLogLevel(net?: string): string {
  const config = readConfigFile(net);
  return get(config, 'logging.log_level', 'DEBUG');
}

export default async function loadConfig(net?: string): Promise<{
  url: string;
  cert: string;
  key: string;
  logPath?: string;
  logLevel?: string;
}> {
  try {
    const config = readConfigFile(net);

    const selfHostname = get(config, 'ui.daemon_host', 'localhost');
    const daemonPort = get(config, 'ui.daemon_port', 55_400);

    // store these in the global object so they can be used by both main and renderer processes
    const url = `wss://${selfHostname}:${daemonPort}`;
    const configRootDir = getConfigRootDir(net);

    const certPath = path.resolve(
      configRootDir,
      get(config, 'ui.daemon_ssl.private_crt', 'config/ssl/daemon/private_daemon.crt')
    );
    const keyPath = path.resolve(
      configRootDir,
      get(config, 'ui.daemon_ssl.private_key', 'config/ssl/daemon/private_daemon.key')
    );

    const logPath = getLogPath(net);
    const logLevel = getLogLevel(net);

    return {
      url,
      cert: fs.readFileSync(certPath).toString(),
      key: fs.readFileSync(keyPath).toString(),
      logPath,
      logLevel,
    };
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await sleep(1000);
      return loadConfig(net);
    }
    throw error;
  }
}

const yaml = require('js-yaml');
const fs = require('fs');
const os = require('os');
const path = require('path');

// defaults used in case of error point to the localhost daemon & its certs
let self_hostname = 'localhost';
global.daemon_rpc_ws = `wss://${self_hostname}:55400`;
global.cert_path = 'config/ssl/daemon/private_daemon.crt';
global.key_path = 'config/ssl/daemon/private_daemon.key';

function getConfigFolder() {
  // finding the right config file uses this precedence
  // 1) CHIA_ROOT environment variable
  // 2) see if mainnet folder exists
  // 3) then just not assume testnet
  if ('CHIA_ROOT' in process.env) {
    return process.env.CHIA_ROOT;
  }
  const mainnet = path.join(os.homedir(), '.chia', 'mainnet');
  if (fs.existsSync(mainnet)) {
    return mainnet;
  }
  return path.join(os.homedir(), '.chia', 'testnet');
}

function loadConfig() {
  try {
    const config_root_dir = getConfigFolder();
    console.log(`loading config from ${config_root_dir}`);

    const config = yaml.load(
      fs.readFileSync(path.join(config_root_dir, 'config/config.yaml'), 'utf8'),
    );

    self_hostname = config?.ui?.daemon_host ?? 'localhost'; // jshint ignore:line
    const daemon_port = config?.ui?.daemon_port ?? 55400; // jshint ignore:line

    // store these in the global object so they can be used by both main and renderer processes
    global.daemon_rpc_ws = `wss://${self_hostname}:${daemon_port}`;
    global.cert_path = path.join(
      config_root_dir,
      config?.ui?.daemon_ssl?.private_crt ??
        'config/ssl/daemon/private_daemon.crt',
    ); // jshint ignore:line
    global.key_path = path.join(
      config_root_dir,
      config?.ui?.daemon_ssl?.private_key ??
        'config/ssl/daemon/private_daemon.key',
    ); // jshint ignore:line
  } catch (e) {
    console.log('Error loading config - using defaults');
  }
}

function manageDaemonLifetime() {
  // only start/stop daemon if it is running locally
  return self_hostname === 'localhost';
}

module.exports = {
  loadConfig,
  manageDaemonLifetime,
  self_hostname,
};

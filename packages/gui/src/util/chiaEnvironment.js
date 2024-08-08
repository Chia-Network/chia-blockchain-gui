const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

/** ***********************************************************
 * py process
 ************************************************************ */

const PY_DIST_FOLDER = path.join(__dirname, '../../../app.asar.unpacked/daemon');
const PY_CHIA_EXEC = 'chia';
const CHIA_START_ARGS = Object.freeze(['start', 'daemon', '--skip-keyring']);

let pyProc = null;
let haveCert = null;

let IS_PACKAGED = null;
const EXEC_PATH_CACHE = {}; // {[execName]: execPath}

const guessPackaged = () => {
  // This is very important. This means guessing whether it's packaged is checked only once in a process lifetime.
  // This reduces the possibility that we change the guessing and run a different chia executable in a process lifetime.
  if (typeof IS_PACKAGED === 'boolean') {
    return IS_PACKAGED;
  }
  IS_PACKAGED = fs.existsSync(PY_DIST_FOLDER);
  return IS_PACKAGED;
};

const getVirtualEnvExecDir = () => {
  if ('VIRTUAL_ENV' in process.env) {
    return path.join(process.env.VIRTUAL_ENV, process.platform === 'win32' ? 'Scripts' : 'bin');
  }
  return null;
};

const getExecutablePath = (execName) => {
  // This also means getting exec path is done only once
  // to prevent to run a different executable with the same name in a process lifetime.
  if (Object.prototype.hasOwnProperty.call(EXEC_PATH_CACHE, execName)) {
    return EXEC_PATH_CACHE[execName];
  }

  const execDir = guessPackaged() ? PY_DIST_FOLDER : getVirtualEnvExecDir();
  if (execDir === null || !fs.existsSync(execDir)) {
    throw new Error(`Executable dir was not found at: ${execDir}`);
  }

  if (process.platform === 'win32') {
    let execPath = path.join(execDir, `${execName}.exe`);
    if (fs.existsSync(execPath)) {
      EXEC_PATH_CACHE[execName] = execPath;
      return execPath;
    }
    execPath = path.join(execDir, `${execName}.cmd`).replace(new RegExp(path.posix.sep, 'g'), path.win32.sep);
    if (fs.existsSync(execPath)) {
      EXEC_PATH_CACHE[execName] = execPath;
      return execPath;
    }
    throw new Error(`chia executable could not be found in: ${execDir}`);
  }

  EXEC_PATH_CACHE[execName] = path.join(execDir, execName);
  return EXEC_PATH_CACHE[execName];
};

const getChiaVersion = () => {
  const chiaExecPath = getExecutablePath(PY_CHIA_EXEC);
  return childProcess
    .execFileSync(chiaExecPath, ['version'], {
      encoding: 'UTF-8',
    })
    .trim();
};

const chiaInit = () => {
  const chiaExecPath = getExecutablePath(PY_CHIA_EXEC);
  console.info(`Executing: ${chiaExecPath} init`);

  try {
    const output = childProcess.execFileSync(chiaExecPath, ['init']);
    console.info(output.toString());
    return true;
  } catch (e) {
    console.error('Error: ');
    console.error(e);
    return false;
  }
};

const startChiaDaemon = () => {
  pyProc = null;

  const chiaExec = getExecutablePath(PY_CHIA_EXEC);
  console.info('Running python executable: ');
  console.info(`Script: ${chiaExec} ${CHIA_START_ARGS.join(' ')}`);

  try {
    const Process = childProcess.spawn;
    pyProc = new Process(chiaExec, CHIA_START_ARGS);
  } catch (e) {
    console.error('Running python executable: Error: ');
    console.error(e);
  }

  if (!pyProc) {
    throw new Error('Failed to start chia daemon');
  }

  pyProc.stdout.setEncoding('utf8');

  pyProc.stdout.on('data', (data) => {
    if (!haveCert) {
      process.stdout.write('No cert\n');
      // listen for ssl path message
      try {
        const strArr = data.toString().split('\n');
        for (let i = 0; i < strArr.length; i++) {
          const str = strArr[i];
          try {
            const json = JSON.parse(str);
            global.cert_path = json.cert;
            global.key_path = json.key;
            // TODO Zlatko: cert_path and key_path were undefined. Prefixed them with global, which changes functionality.
            // Do they even need to be globals?
            if (global.cert_path && global.key_path) {
              haveCert = true;
              process.stdout.write('Have cert\n');
              return;
            }
          } catch (e) {
            // Do nothing
          }
        }
      } catch (e) {
        // Do nothing
      }
    }

    process.stdout.write(data.toString());
  });

  pyProc.stderr.setEncoding('utf8');
  pyProc.stderr.on('data', (data) => {
    // Here is where the error output goes
    process.stdout.write(`stderr: ${data.toString()}`);
  });

  pyProc.on('close', (code) => {
    // Here you can get the exit code of the script
    console.info(`closing code: ${code}`);
  });

  console.info('child process success');
};

module.exports = {
  chiaInit,
  startChiaDaemon,
  getChiaVersion,
  guessPackaged,
};

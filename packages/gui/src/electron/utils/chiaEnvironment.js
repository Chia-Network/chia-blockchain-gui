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

  let procOption;
  if (process.platform !== 'win32') {
    procOption = {
      detached: true,
      windowsHide: true,
    };
  }

  const chiaExec = getExecutablePath(PY_CHIA_EXEC);
  console.info('Running python executable: ');
  console.info(`Script: ${chiaExec} ${CHIA_START_ARGS.join(' ')}`);

  try {
    pyProc = childProcess.spawn(chiaExec, CHIA_START_ARGS, procOption);
  } catch (e) {
    console.error('Running python executable: Error: ');
    console.error(e);
  }

  if (!pyProc) {
    throw new Error('Failed to start chia daemon');
  }

  pyProc.stdout.setEncoding('utf8');
  pyProc.stdout.on('data', (data) => {
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

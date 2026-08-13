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
const LAUNCH_CACHE = {}; // {[execName]: { command, prefixArgs }}

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

/**
 * Resolve a spawnable chia launch without using shell:true.
 * On Windows venvs that only ship chia.cmd, spawn python.exe + the chia script
 * (same as chia.cmd) to avoid EINVAL under CVE-2024-27980.
 */
const getChiaLaunch = (execName = PY_CHIA_EXEC) => {
  // Getting launch config is done only once to prevent running a different
  // executable with the same name in a process lifetime.
  if (Object.prototype.hasOwnProperty.call(LAUNCH_CACHE, execName)) {
    return LAUNCH_CACHE[execName];
  }

  const execDir = guessPackaged() ? PY_DIST_FOLDER : getVirtualEnvExecDir();
  if (execDir === null || !fs.existsSync(execDir)) {
    throw new Error(`Executable dir was not found at: ${execDir}`);
  }

  if (process.platform === 'win32') {
    const exePath = path.join(execDir, `${execName}.exe`);
    if (fs.existsSync(exePath)) {
      LAUNCH_CACHE[execName] = { command: exePath, prefixArgs: [] };
      return LAUNCH_CACHE[execName];
    }

    const pythonPath = path.join(execDir, 'python.exe');
    const scriptPath = path.join(execDir, execName);
    if (!fs.existsSync(pythonPath)) {
      throw new Error(`python.exe could not be found in: ${execDir}`);
    }
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`chia script could not be found in: ${execDir}`);
    }

    LAUNCH_CACHE[execName] = { command: pythonPath, prefixArgs: [scriptPath] };
    return LAUNCH_CACHE[execName];
  }

  LAUNCH_CACHE[execName] = { command: path.join(execDir, execName), prefixArgs: [] };
  return LAUNCH_CACHE[execName];
};

const getChiaVersion = () => {
  const { command, prefixArgs } = getChiaLaunch();
  return childProcess
    .execFileSync(command, [...prefixArgs, 'version'], {
      encoding: 'UTF-8',
    })
    .trim();
};

const chiaInit = () => {
  const { command, prefixArgs } = getChiaLaunch();
  const args = [...prefixArgs, 'init'];
  console.info(`Executing: ${command} ${args.join(' ')}`);

  try {
    const output = childProcess.execFileSync(command, args);
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

  const { command, prefixArgs } = getChiaLaunch();
  const args = [...prefixArgs, ...CHIA_START_ARGS];
  console.info('Running python executable: ');
  console.info(`Script: ${command} ${args.join(' ')}`);

  try {
    pyProc = childProcess.spawn(command, args, procOption);
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

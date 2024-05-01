const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

/** ***********************************************************
 * py process
 ************************************************************ */

const PY_MAC_DIST_FOLDER = '../../../app.asar.unpacked/daemon';
const PY_WIN_DIST_FOLDER = '../../../app.asar.unpacked/daemon';
const PY_DIST_EXECUTABLE = 'chia';
const PY_DIST_EXEC_ARGS = Object.freeze(['start', 'daemon', '--skip-keyring']);

const PY_DEV_EXECUTABLE = `../../../venv/${process.platform === 'win32' ? 'Scripts/chia.exe' : 'bin/chia'}`;
const PY_DEV_EXEC_ARGS = Object.freeze(['start', 'daemon', '--skip-keyring']);

let pyProc = null;
let haveCert = null;

const guessPackaged = () => {
  let packed;
  if (process.platform === 'win32') {
    const fullPath = path.join(__dirname, PY_WIN_DIST_FOLDER);
    packed = fs.existsSync(fullPath);
    return packed;
  }
  const fullPath = path.join(__dirname, PY_MAC_DIST_FOLDER);
  packed = fs.existsSync(fullPath);
  return packed;
};

const getExecutablePath = (dist_file) => {
  if (process.platform === 'win32') {
    return path.join(__dirname, PY_WIN_DIST_FOLDER, `${dist_file}.exe`);
  }
  return path.join(__dirname, PY_MAC_DIST_FOLDER, dist_file);
};

const getChiaVersion = () => {
  let version = null;
  const exePath = getExecutablePath('chia');
  // first see if we can get a chia exe in a standard location relative to where we are
  try {
    version = childProcess
      .execFileSync(exePath, ['version'], {
        encoding: 'UTF-8',
      })
      .trim();
  } catch (e1) {
    // that didn't work, let's try as if we're in the venv or chia is on the path
    try {
      version = childProcess
        .execFileSync(path.basename(exePath), ['version'], {
          encoding: 'UTF-8',
        })
        .trim();
    } catch (e2) {
      // that didn't work either - give up
    }
  }

  return version;
};

const chiaInit = () => {
  if (guessPackaged()) {
    const executablePath = getExecutablePath(PY_DIST_EXECUTABLE);
    console.info(`Executing: ${executablePath} init`);

    try {
      const output = childProcess.execFileSync(executablePath, ['init']);
      console.info(output.toString());
    } catch (e) {
      console.error('Error: ');
      console.error(e);
    }
  } else {
    console.info(`Executing: ${PY_DEV_EXECUTABLE} init`);

    try {
      const output = childProcess.execFileSync(PY_DEV_EXECUTABLE, ['init']);
      console.info(output.toString());
    } catch (e) {
      console.error('Error: ');
      console.error(e);
    }
  }
};

const startChiaDaemon = () => {
  pyProc = null;

  if (guessPackaged()) {
    const executablePath = getExecutablePath(PY_DIST_EXECUTABLE);
    console.info('Running python executable: ');
    console.info(`Script: ${executablePath} ${PY_DIST_EXEC_ARGS.join(' ')}`);

    try {
      const Process = childProcess.spawn;
      pyProc = new Process(executablePath, PY_DIST_EXEC_ARGS);
    } catch (e) {
      console.error('Running python executable: Error: ');
      console.error(e);
    }
  } else {
    console.info('Running python script');
    console.info(`Script: ${PY_DEV_EXECUTABLE} ${PY_DEV_EXEC_ARGS.join(' ')}`);

    try {
      const Process = childProcess.spawn;
      pyProc = new Process(PY_DEV_EXECUTABLE, PY_DEV_EXEC_ARGS);
    } catch (e) {
      console.error('Running python script: Error: ');
      console.error(e);
    }
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

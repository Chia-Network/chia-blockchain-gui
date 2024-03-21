const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

/** ***********************************************************
 * py process
 ************************************************************ */

const PY_MAC_DIST_FOLDER = '../../../app.asar.unpacked/daemon';
const PY_WIN_DIST_FOLDER = '../../../app.asar.unpacked/daemon';
const PY_DIST_EXECUTABLE = 'chia';
const PY_DIST_EXEC_ARGS = Object.freeze(['start', 'daemon']);

const PY_DEV_EXECUTABLE = '../../../chia/cmds/main.py';
const PY_DEV_EXEC_ARGS = Object.freeze([PY_DEV_EXECUTABLE, 'start', 'daemon']);

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

const startChiaDaemon = () => {
  const processOptions = {};
  if (process.platform === 'win32') {
    // We want to detach child daemon process from parent GUI process.
    // You may think `detached: true` will do but it shows blank terminal on Windows.
    // In order to hide the blank terminal while detaching child process,
    // {detached: false, windowsHide: false, shell: true} works which is exact opposite of what we expect
    // Please see the comment below for more details.
    // https://github.com/nodejs/node/issues/21825#issuecomment-503766781
    processOptions.detached = false;
    processOptions.stdio = 'ignore';
    processOptions.windowsHide = false;
    processOptions.shell = true;
  } else {
    processOptions.detached = true;
    // processOptions.stdio = 'ignore';
    processOptions.windowsHide = true;
  }

  pyProc = null;

  if (guessPackaged()) {
    const executablePath = getExecutablePath(PY_DIST_EXECUTABLE);
    console.info('Running python executable: ');

    try {
      if (processOptions.stdio === 'ignore') {
        const subProcess = childProcess.spawn(executablePath, PY_DIST_EXEC_ARGS, processOptions);
        subProcess.unref();
      } else {
        const Process = childProcess.spawn;
        pyProc = new Process(executablePath, PY_DIST_EXEC_ARGS, processOptions);
      }
    } catch (e) {
      console.info('Running python executable: Error: ');
      console.info(`Script: ${executablePath} ${PY_DIST_EXEC_ARGS.join(' ')}`);
    }
  } else {
    console.info('Running python script');
    console.info(`Script: python ${PY_DEV_EXEC_ARGS.join(' ')}`);

    if (processOptions.stdio === 'ignore') {
      const subProcess = childProcess.spawn('python', PY_DEV_EXEC_ARGS, processOptions);
      subProcess.unref();
    } else {
      const Process = childProcess.spawn;
      pyProc = new Process('python', PY_DEV_EXEC_ARGS, processOptions);
    }
  }

  if (!pyProc) {
    throw new Error('Failed to start chia daemon');
  }

  if (processOptions.stdio === 'ignore') {
    return;
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
  startChiaDaemon,
  getChiaVersion,
  guessPackaged,
};

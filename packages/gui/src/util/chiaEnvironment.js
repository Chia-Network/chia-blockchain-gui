const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

/** ***********************************************************
 * py process
 ************************************************************ */

const PY_MAC_DIST_FOLDER = '../../../app.asar.unpacked/daemon';
const PY_WIN_DIST_FOLDER = '../../../app.asar.unpacked/daemon';
const PY_DIST_FILE = 'daemon';
const PY_FOLDER = '../../../chia/daemon';
const PY_MODULE = 'server'; // without .py suffix

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

const getScriptPath = (dist_file) => {
  if (!guessPackaged()) {
    return path.join(PY_FOLDER, `${PY_MODULE}.py`);
  }
  return getExecutablePath(dist_file);
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

const spawnChildProcess = (command, args = [], options = undefined) => {
  // As of Feb 11 2024, there is a bug in Electron that prevents electron from exiting when a child process is spawned and detached.
  // This is a workaround for that bug.
  if (process.platform === 'linux') {
    // https://github.com/electron/electron/issues/34808#issuecomment-1275530924
    return childProcess.spawn(
      '/bin/bash',
      [
        '-c',
        'for fd in $(ls /proc/$$/fd); do case "$fd" in 0|1|2|255) ;; *) eval "exec $fd<&-" ;; esac; done; exec "$@"',
        '--',
        command,
        ...args,
      ],
      options
    );
  }
  return childProcess.spawn(command, args, options);
};

const startChiaDaemon = () => {
  const script = getScriptPath(PY_DIST_FILE);
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
    processOptions.stdio = 'ignore';
    processOptions.windowsHide = true;
  }
  pyProc = null;
  if (guessPackaged()) {
    try {
      console.info('Running python executable: ');
      if (processOptions.stdio === 'ignore') {
        const subProcess = spawnChildProcess(script, ['--wait-for-unlock'], processOptions);
        subProcess.unref();
      } else {
        const Process = childProcess.spawn;
        pyProc = new Process(script, ['--wait-for-unlock'], processOptions);
      }
    } catch (e) {
      console.info('Running python executable: Error: ');
      console.info(`Script ${script}`);
    }
  } else {
    console.info('Running python script');
    console.info(`Script ${script}`);

    if (processOptions.stdio === 'ignore') {
      const subProcess = spawnChildProcess('python', [script, '--wait-for-unlock'], processOptions);
      subProcess.unref();
    } else {
      const Process = childProcess.spawn;
      pyProc = new Process('python', [script, '--wait-for-unlock'], processOptions);
    }
  }
  if (pyProc != null && processOptions.stdio !== 'ignore') {
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
  }
  // pyProc.unref();
};

module.exports = {
  startChiaDaemon,
  getChiaVersion,
  guessPackaged,
};

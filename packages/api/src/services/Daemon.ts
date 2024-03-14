import debug from 'debug';

import KeyData from '../@types/KeyData';
import KeyringStatus from '../@types/KeyringStatus';
import PlotQueueItem from '../@types/PlotQueueItem';
import { PlottersApi } from '../@types/Plotter';
import Response from '../@types/Response';
import WalletAddress from '../@types/WalletAddress';
import type Client from '../Client';
import Message from '../Message';
import ServiceName, { type ServiceNameValue } from '../constants/ServiceName';
import sleep from '../utils/sleep';

import Service from './Service';
import type { Options } from './Service';

const log = debug('chia-api:daemon');

export default class Daemon extends Service {
  static isDaemon = true;

  private serviceStartPromises: Partial<
    Record<
      ServiceNameValue,
      Promise<{
        service: ServiceNameValue;
      }>
    >
  > = {};

  private serviceStopPromises: Partial<Record<ServiceNameValue, Promise<void>>> = {};

  #runningServices: Partial<Record<ServiceNameValue, boolean>> = {};

  private waitForKeyringUnlockedPromise: Promise<void> | null = null;

  constructor(client: Client, options?: Options) {
    super(ServiceName.DAEMON, client, options);
  }

  registerService(args: { service: ServiceNameValue }) {
    return this.command<{
      queue: [PlotQueueItem];
    }>('register_service', args);
  }

  async startService(args: { service: ServiceNameValue; testing?: boolean; noWait?: boolean }) {
    const { noWait, ...rest } = args;
    const { service } = args;

    if (noWait) {
      return this.command<{
        service: ServiceNameValue;
      }>('start_service', rest);
    }

    if (service in this.serviceStartPromises) {
      return this.serviceStartPromises[service];
    }

    const startServiceAndWait = async () => {
      const response = await this.command<{
        service: ServiceNameValue;
      }>('start_service', rest);

      // wait for service to be running
      await this.waitForService(service, true);

      // remove service from serviceStartPromises
      if (service in this.serviceStartPromises) {
        delete this.serviceStartPromises[service];
      }

      this.#runningServices[service] = true;

      return response;
    };

    const promise = startServiceAndWait();

    this.serviceStartPromises[service] = promise;

    return promise;
  }

  async stopService(args: { service: ServiceNameValue; noWait?: boolean }) {
    // remove service from servicesState
    const { noWait, ...rest } = args;
    const { service } = args;

    this.#runningServices[service] = false;

    if (noWait) {
      return this.command<void>('stop_service', rest);
    }

    if (service in this.serviceStopPromises) {
      return this.serviceStopPromises[service];
    }

    const stopServiceAndWait = async () => {
      const response = await this.command<void>('stop_service', rest);

      // wait for service to be stopped
      await this.waitForService(service, false);

      // remove service from serviceStartPromises
      if (service in this.serviceStopPromises) {
        delete this.serviceStopPromises[service];
      }

      return response;
    };

    const promise = stopServiceAndWait();

    this.serviceStopPromises[service] = promise;

    return promise;
  }

  isServiceStarted(service: ServiceNameValue) {
    return service in this.#runningServices && this.#runningServices[service];
  }

  isRunning(args: { service: ServiceNameValue }) {
    return this.command<{
      isRunning: boolean;
    }>('is_running', args);
  }

  async runningServices() {
    return this.command<{
      runningServices: [string];
    }>('running_services');
  }

  async waitForService(service: ServiceNameValue, waitForStart: boolean, maxRetries: number = 600) {
    // 10 minutes
    const { client } = this;

    if (maxRetries <= 0) {
      throw new Error(`Max retries reached. Service: ${service} did not start`);
    }

    if (waitForStart) {
      try {
        const { data } = <Message & { data: Response }>await client.send(
          new Message({
            command: 'ping',
            origin: client.origin,
            destination: service,
          }),
          1000,
        );

        if (data.success) {
          log(`Service: ${service} started`);
          return;
        }
      } catch (error) {
        log(`Service ping: ${service} failed. ${(error as Error).message}`);
      }
    } else {
      const { isRunning } = await this.isRunning({ service });
      if (!isRunning) {
        log(`Service: ${service} stopped`);
        return;
      }
    }

    await sleep(1000);
    await this.waitForService(service, waitForStart, maxRetries - 1);
  }

  addPrivateKey(args: { mnemonic: string; label?: string }) {
    return this.command<{
      fingerprint: string;
    }>('add_private_key', args);
  }

  getKey(args: { fingerprint: string; includeSecrets?: boolean }) {
    return this.command<{
      key: KeyData;
    }>('get_key', args);
  }

  getKeys(args: { includeSecrets?: boolean }) {
    return this.command<{
      keys: [KeyData];
    }>('get_keys', args);
  }

  getWalletAddresses(args: {
    fingerprints?: number[];
    count?: number;
    index?: number;
    nonObserverDerivation?: boolean;
  }) {
    return this.command<{
      walletAddresses: {
        [key: string]: WalletAddress[];
      };
    }>('get_wallet_addresses', args);
  }

  setLabel(args: { fingerprint: string; label: string }) {
    return this.command<void>('set_label', args);
  }

  deleteLabel(args: { fingerprint: string }) {
    return this.command<void>('delete_label', args);
  }

  async keyringStatus() {
    return this.command<KeyringStatus>('keyring_status');
  }

  setKeyringPassphrase(args: {
    currentPassphrase?: string | null;
    newPassphrase?: string;
    passphraseHint?: string;
    savePassphrase?: boolean;
  }) {
    return this.command<void>('set_keyring_passphrase', args);
  }

  removeKeyringPassphrase(args: { currentPassphrase: string }) {
    return this.command<void>('remove_keyring_passphrase', args);
  }

  migrateKeyring(args: {
    passphrase: string;
    passphraseHint: string;
    savePassphrase: boolean;
    cleanupLegacyKeyring: boolean;
  }) {
    return this.command<void>('migrate_keyring', args);
  }

  unlockKeyring(args: { key: string }) {
    return this.command<void>('unlock_keyring', args);
  }

  getPlotters() {
    return this.command<{
      plotters: PlottersApi;
    }>('get_plotters');
  }

  stopPlotting(args: { id: string }) {
    return this.command('stop_plotting', {
      ...args,
      service: ServiceName.PLOTTER,
    });
  }

  startPlotting(inputArgs: {
    bladebitDisableNUMA?: boolean;
    bladebitWarmStart?: boolean;
    bladebitNoCpuAffinity?: boolean;
    bladebitCompressionLevel?: number;
    bladebitDiskCache?: number;
    bladebitDiskF1Threads?: number;
    bladebitDiskFpThreads?: number;
    bladebitDiskCThreads?: number;
    bladebitDiskP2Threads?: number;
    bladebitDiskP3Threads?: number;
    bladebitDiskAlternate?: boolean;
    bladebitDiskNoT1Direct?: boolean;
    bladebitDiskNoT2Direct?: boolean;
    bladebitDeviceIndex?: number;
    bladebitEnableDisk128Mode?: boolean;
    bladebitEnableDisk16Mode?: boolean;
    c?: string;
    delay: number;
    disableBitfieldPlotting?: boolean;
    excludeFinalDir?: boolean;
    farmerPublicKey?: string;
    finalLocation: string;
    fingerprint?: number;
    madmaxNumBucketsPhase3?: number;
    madmaxTempToggle?: boolean;
    madmaxThreadMultiplier?: number;
    maxRam: number;
    numBuckets: number;
    numThreads: number;
    overrideK?: boolean;
    parallel: boolean;
    plotCount: number;
    plotSize: number;
    plotterName: string;
    plotType?: string;
    poolPublicKey?: string;
    queue: string;
    workspaceLocation: string;
    workspaceLocation2: string;
  }) {
    const conversionDict: Record<string, string> = {
      bladebitDisableNUMA: 'm',
      bladebitWarmStart: 'w',
      bladebitNoCpuAffinity: 'no_cpu_affinity',
      bladebitCompressionLevel: 'compress',
      bladebitDiskCache: 'cache',
      bladebitDiskF1Threads: 'f1_threads',
      bladebitDiskFpThreads: 'fp_threads',
      bladebitDiskCThreads: 'c_threads',
      bladebitDiskP2Threads: 'p2_threads',
      bladebitDiskP3Threads: 'p3_threads',
      bladebitDiskAlternate: 'alternate',
      bladebitDiskNoT1Direct: 'no_t1_direct',
      bladebitDiskNoT2Direct: 'no_t2_direct',
      bladebitDeviceIndex: 'device',
      bladebitEnableDisk128Mode: 'disk_128',
      bladebitEnableDisk16Mode: 'disk_16',
      disableBitfieldPlotting: 'e',
      excludeFinalDir: 'x',
      farmerPublicKey: 'f',
      finalLocation: 'd',
      fingerprint: 'a',
      madmaxNumBucketsPhase3: 'v',
      madmaxTempToggle: 'G',
      madmaxThreadMultiplier: 'K',
      maxRam: 'b',
      numBuckets: 'u',
      numThreads: 'r',
      plotCount: 'n',
      plotSize: 'k',
      plotterName: 'plotter',
      plotType: 'plot_type',
      poolPublicKey: 'p',
      workspaceLocation: 't',
      workspaceLocation2: 't2',
    };

    const outputArgs: Record<string, unknown> = { service: ServiceName.PLOTTER };

    Object.keys(inputArgs).forEach((key) => {
      if (conversionDict[key]) outputArgs[conversionDict[key]] = inputArgs[key as keyof typeof inputArgs];
      else outputArgs[key] = inputArgs[key as keyof typeof inputArgs];
    });

    if (outputArgs.plotter && (outputArgs.plotter as string).startsWith('bladebit')) outputArgs.plotter = 'bladebit';
    if (outputArgs.cache) outputArgs.cache = `${outputArgs.cache}G`;

    Object.keys(outputArgs).forEach((key) => {
      if (outputArgs[key] === undefined) delete outputArgs[key];
      if (['t', 't2'].includes(key) && outputArgs[key] === '') {
        delete outputArgs[key];
      }
    });

    // some keys must be provided as empty strings and some must not be provided at all
    if (outputArgs.p === '') delete outputArgs.p;

    return this.command<{ ids: string[] }>('start_plotting', outputArgs, undefined, undefined, true);
  }

  exit() {
    return this.command<void>('exit');
  }

  async stopAllServices() {
    const { runningServices } = (await this.runningServices()) as { runningServices: ServiceNameValue[] };

    return Promise.all(
      runningServices.map((service) => {
        if (service.startsWith('chia_')) {
          return this.stopService({ service });
        }

        return undefined;
      }),
    );
  }

  onKeyringStatusChanged(callback: (data: any, message: Message) => void, processData?: (data: any) => any) {
    return this.onCommand('keyring_status_changed', callback, processData);
  }

  async waitForKeyringUnlocked(): Promise<void> {
    const checkKeyringStatusAndWait = async (resolve: (value: void) => void, reject: (reason: Error) => void) => {
      let unsubscribe: undefined | (() => void);

      try {
        unsubscribe = this.onKeyringStatusChanged((data: any) => {
          if (data.isKeyringLocked === false) {
            if (unsubscribe) {
              unsubscribe();
            }
            resolve();
          }
        });

        const { isKeyringLocked } = await this.keyringStatus();
        if (!isKeyringLocked) {
          if (unsubscribe) {
            unsubscribe();
          }
          resolve();
        }
      } catch (err) {
        if (unsubscribe) {
          unsubscribe();
        }
        reject(err as Error);
      }
    };

    if (this.waitForKeyringUnlockedPromise) {
      return this.waitForKeyringUnlockedPromise;
    }

    this.waitForKeyringUnlockedPromise = new Promise<void>((resolve, reject) => {
      checkKeyringStatusAndWait(resolve, reject);
    }).finally(() => {
      this.waitForKeyringUnlockedPromise = null;
    });

    return this.waitForKeyringUnlockedPromise;
  }

  getVersion() {
    return this.command<{ version: string }>('get_version');
  }

  getKeysForPlotting(args?: { fingerprints?: number[] }) {
    return this.command<{ keys: { [fingerprint: number]: { farmerPublicKey: string; poolPublicKey: string } } }>(
      'get_keys_for_plotting',
      args,
    );
  }

  getPublicKey(args?: { fingerprint: number }) {
    return this.command<{
      key: any;
    }>('get_public_key', args);
  }
}

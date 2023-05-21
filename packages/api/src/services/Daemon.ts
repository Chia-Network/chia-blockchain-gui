import KeyData from '../@types/KeyData';
import KeyringStatus from '../@types/KeyringStatus';
import PlotQueueItem from '../@types/PlotQueueItem';
import { PlottersApi } from '../@types/Plotter';
import type Client from '../Client';
import type Message from '../Message';
import ServiceName, { type ServiceNameValue } from '../constants/ServiceName';
import Service from './Service';
import type { Options } from './Service';

export default class Daemon extends Service {
  constructor(client: Client, options?: Options) {
    super(ServiceName.DAEMON, client, {
      skipAddService: true,
      ...options,
    });
  }

  registerService(args: { service: ServiceNameValue }) {
    return this.command<{
      queue: [PlotQueueItem];
    }>('register_service', args);
  }

  startService(args: { service: ServiceNameValue; testing?: boolean }) {
    return this.command<{
      service: ServiceNameValue;
    }>('start_service', args);
  }

  stopService(args: { service: ServiceNameValue }) {
    return this.command<void>('stop_service', args);
  }

  isRunning(args: { service: ServiceNameValue }) {
    return this.command<{
      isRunning: boolean;
    }>('is_running', args);
  }

  runningServices() {
    return this.command<{
      runningServices: [string];
    }>('running_services');
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

  setLabel(args: { fingerprint: string; label: string }) {
    return this.command<void>('set_label', args);
  }

  deleteLabel(args: { fingerprint: string }) {
    return this.command<void>('delete_label', args);
  }

  keyringStatus() {
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
    bladebitDisableNUMA: boolean;
    bladebitWarmStart: boolean;
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
    bladebitDisableDirectDownloads?: boolean;
    c?: string;
    delay: number;
    disableBitfieldPlotting?: boolean;
    excludeFinalDir?: boolean;
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
      bladebitDisableDirectDownloads: 'no_direct_downloads',
      disableBitfieldPlotting: 'e',
      excludeFinalDir: 'x',
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
    if (!outputArgs.compressionLevel) delete outputArgs.compressionLevel;

    Object.keys(outputArgs).forEach((key) => {
      if (outputArgs[key] === undefined) delete outputArgs[key];
      // if (outputArgs[key] === '') delete outputArgs[key];
    });

    // some keys must be provided as empty strings and some must not be provided at all
    if (outputArgs.p === '') delete outputArgs.p;

    return this.command<{ ids: string[] }>('start_plotting', outputArgs, undefined, undefined, true);
  }

  exit() {
    return this.command<void>('exit');
  }

  onKeyringStatusChanged(callback: (data: any, message: Message) => void, processData?: (data: any) => any) {
    return this.onStateChanged('keyring_status_changed', callback, processData);
  }

  getVersion() {
    return this.command<{ version: string }>('get_version');
  }
}

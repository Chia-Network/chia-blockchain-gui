import { PlotQueueItem, KeyringStatus, KeyData, PlottersApi } from '../@types';
import type Client from '../Client';
import type Message from '../Message';
import ServiceName from '../constants/ServiceName';
import Service from './Service';
import type { Options } from './Service';

export default class Daemon extends Service {
  constructor(client: Client, options?: Options) {
    super(ServiceName.DAEMON, client, {
      skipAddService: true,
      ...options,
    });
  }

  registerService(args: { service: string }) {
    return this.command<{
      queue: [PlotQueueItem];
    }>('register_service', args);
  }

  startService(args: { service: string; testing?: boolean }) {
    return this.command<{
      service: string;
    }>('start_service', args);
  }

  stopService(args: { service: string }) {
    return this.command<void>('stop_service', args);
  }

  isRunning(args: { service: string }) {
    return this.command<{
      isRunning: boolean;
    }>('is_running', args);
  }

  runningServices() {
    return this.command<{
      running_services: [string];
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

  // TODO refactor
  startPlotting(inputArgs: {
    plotterName: string; // plotterName
    k: number; // plotSize
    n: number; // plotCount
    t: string; // workspaceLocation
    t2: string; // workspaceLocation2
    d: string; // finalLocation
    b: number; // maxRam
    u: number; // numBuckets
    r: number; // numThreads,
    queue: string; // queue
    a: number | undefined; // fingerprint
    parallel: boolean; // parallel
    delay: number; // delay
    e?: boolean; // disableBitfieldPlotting
    x?: boolean; // excludeFinalDir
    overrideK?: boolean; // overrideK
    f?: string; // farmerPublicKey
    p?: string; // poolPublicKey
    c?: string; // poolContractAddress
    mm_v?: number; // madmaxNumBucketsPhase3,
    mm_G?: boolean; // madmaxTempToggle,
    mm_K?: number; // madmaxThreadMultiplier,
    plot_type?: string; // 'diskplot' or 'ramplot'
    bb_disable_numa?: boolean; // bladebitDisableNUMA,
    bb_warm_start?: boolean; // bladebitWarmStart,
    bb_no_cpu_affinity?: boolean; // bladebitNoCpuAffinity
    bbdisk_cache?: number; // bladebitDiskCache
    bbdisk_f1_threads?: number; // bladebitDiskF1Threads
    bbdisk_fp_threads?: number; // bladebitDiskFpThreads
    bbdisk_c_threads?: number; // bladebitDiskCThreads
    bbdisk_p2_threads?: number; // bladebitDiskP2Threads
    bbdisk_p3_threads?: number; // bladebitDiskP3Threads
    bbdisk_alternate?: boolean; // bladebitDiskAlternate
    bbdisk_no_t1_direct?: boolean; // bladebitDiskNoT1Direct
    bbdisk_no_t2_direct?: boolean; // bladebitDiskNoT2Direct
  }) {
    const {
      plotterName,
      k,
      n,
      t,
      t2,
      d,
      b,
      u,
      r,
      queue,
      a,
      parallel,
      delay,
      e,
      x,
      overrideK,
      f,
      p,
      c,
      mm_v,
      mm_G,
      mm_K,
      plot_type,
      bb_disable_numa,
      bb_warm_start,
      bb_no_cpu_affinity,
      bbdisk_cache,
      bbdisk_f1_threads,
      bbdisk_fp_threads,
      bbdisk_c_threads,
      bbdisk_p2_threads,
      bbdisk_p3_threads,
      bbdisk_alternate,
      bbdisk_no_t1_direct,
      bbdisk_no_t2_direct,
    } = inputArgs;

    const outputArgs: Record<string, unknown> = {
      service: ServiceName.PLOTTER,
      plotter: plotterName.startsWith('bladebit') ? 'bladebit' : plotterName,
      k,
      n,
      t,
      t2,
      d,
      b,
      u,
      r,
      queue,
      parallel,
      delay,
      e,
      x,
      overrideK,
    };

    if (a) outputArgs.a = a;
    if (f) outputArgs.f = f;
    if (p) outputArgs.p = p;
    if (c) outputArgs.c = c;
    // madmaxNumBucketsPhase3
    if (mm_v) outputArgs.v = mm_v;
    // madmaxTempToggle
    if (mm_G) outputArgs.G = mm_G;
    // madmaxThreadMultiplier
    if (mm_K) outputArgs.K = mm_K;
    // 'ramplot' or 'diskplot'
    if (plot_type) outputArgs.plot_type = plot_type;
    // bladebitDisableNUMA
    if (bb_disable_numa) outputArgs.m = bb_disable_numa;
    // bladebitWarmStart
    if (bb_warm_start) outputArgs.w = bb_warm_start;
    // bladebitNoCpuAffinity
    if (bb_no_cpu_affinity) outputArgs.no_cpu_affinity = bb_no_cpu_affinity;
    // bladebitDiskCache
    if (bbdisk_cache) outputArgs.cache = `${bbdisk_cache}G`;
    // bladebitDiskF1Threads
    if (bbdisk_f1_threads) outputArgs.f1_threads = bbdisk_f1_threads;
    // bladebitDiskFpThreads
    if (bbdisk_fp_threads) outputArgs.fp_threads = bbdisk_fp_threads;
    // bladebitDiskCThreads
    if (bbdisk_c_threads) outputArgs.c_threads = bbdisk_c_threads;
    // bladebitDiskP2Threads
    if (bbdisk_p2_threads) outputArgs.p2_threads = bbdisk_p2_threads;
    // bladebitDiskP3Threads
    if (bbdisk_p3_threads) outputArgs.p3_threads = bbdisk_p3_threads;
    // bladebitDiskAlternate
    if (bbdisk_alternate) outputArgs.alternate = bbdisk_alternate;
    // bladebitDiskNoT1Direct
    if (bbdisk_no_t1_direct) outputArgs.no_t1_direct = bbdisk_no_t1_direct;
    // bladebitDiskNoT2Direct
    if (bbdisk_no_t2_direct) outputArgs.no_t2_direct = bbdisk_no_t2_direct;

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

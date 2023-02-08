import PlotQueueItem from '../@types/PlotQueueItem';
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

  registerService(service: string) {
    return this.command<{
      queue: [PlotQueueItem];
    }>('register_service', {
      service,
    });
  }

  startService(service: string, testing?: boolean) {
    return this.command('start_service', {
      service,
      testing: testing ? true : undefined,
    });
  }

  stopService(service: string) {
    return this.command('stop_service', {
      service,
    });
  }

  isRunning(service: string) {
    return this.command<{
      isRunning: boolean;
    }>('is_running', {
      service,
    });
  }

  runningServices() {
    return this.command('running_services');
  }

  addPrivateKey(mnemonic: string, label?: string) {
    return this.command('add_private_key', {
      mnemonic,
      label,
    });
  }

  getKey(fingerprint: string, includeSecrets?: boolean) {
    return this.command('get_key', {
      fingerprint,
      includeSecrets,
    });
  }

  getKeys(includeSecrets?: boolean) {
    return this.command('get_keys', {
      includeSecrets,
    });
  }

  setLabel(fingerprint: string, label: string) {
    return this.command('set_label', {
      fingerprint,
      label,
    });
  }

  deleteLabel(fingerprint: string) {
    return this.command('delete_label', {
      fingerprint,
    });
  }

  keyringStatus() {
    return this.command('keyring_status');
  }

  setKeyringPassphrase(
    currentPassphrase?: string | null,
    newPassphrase?: string,
    passphraseHint?: string,
    savePassphrase?: boolean
  ) {
    return this.command('set_keyring_passphrase', {
      currentPassphrase,
      newPassphrase,
      passphraseHint,
      savePassphrase,
    });
  }

  removeKeyringPassphrase(currentPassphrase: string) {
    return this.command('remove_keyring_passphrase', {
      currentPassphrase,
    });
  }

  migrateKeyring(passphrase: string, passphraseHint: string, savePassphrase: boolean, cleanupLegacyKeyring: boolean) {
    return this.command('migrate_keyring', {
      passphrase,
      passphraseHint,
      savePassphrase,
      cleanupLegacyKeyring,
    });
  }

  unlockKeyring(key: string) {
    return this.command('unlock_keyring', {
      key,
    });
  }

  getPlotters() {
    return this.command('get_plotters');
  }

  stopPlotting(id: string) {
    return this.command('stop_plotting', {
      id,
      service: ServiceName.PLOTTER,
    });
  }

  startPlotting(
    plotterName: string, // plotterName
    k: number, // plotSize
    n: number, // plotCount
    t: string, // workspaceLocation
    t2: string, // workspaceLocation2
    d: string, // finalLocation
    b: number, // maxRam
    u: number, // numBuckets
    r: number, // numThreads,
    queue: string, // queue
    a: number | undefined, // fingerprint
    parallel: boolean, // parallel
    delay: number, // delay
    e?: boolean, // disableBitfieldPlotting
    x?: boolean, // excludeFinalDir
    overrideK?: boolean, // overrideK
    f?: string, // farmerPublicKey
    p?: string, // poolPublicKey
    c?: string, // poolContractAddress
    mm_v?: number, // madmaxNumBucketsPhase3,
    mm_G?: boolean, // madmaxTempToggle,
    mm_K?: number, // madmaxThreadMultiplier,
    plot_type?: string, // 'diskplot' or 'ramplot'
    bb_disable_numa?: boolean, // bladebitDisableNUMA,
    bb_warm_start?: boolean, // bladebitWarmStart,
    bb_no_cpu_affinity?: boolean, // bladebitNoCpuAffinity
    bbdisk_cache?: number, // bladebitDiskCache
    bbdisk_f1_threads?: number, // bladebitDiskF1Threads
    bbdisk_fp_threads?: number, // bladebitDiskFpThreads
    bbdisk_c_threads?: number, // bladebitDiskCThreads
    bbdisk_p2_threads?: number, // bladebitDiskP2Threads
    bbdisk_p3_threads?: number, // bladebitDiskP3Threads
    bbdisk_alternate?: boolean, // bladebitDiskAlternate
    bbdisk_no_t1_direct?: boolean, // bladebitDiskNoT1Direct
    bbdisk_no_t2_direct?: boolean // bladebitDiskNoT2Direct
  ) {
    const args: Record<string, unknown> = {
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

    if (a) args.a = a;
    if (f) args.f = f;
    if (p) args.p = p;
    if (c) args.c = c;
    // madmaxNumBucketsPhase3
    if (mm_v) args.v = mm_v;
    // madmaxTempToggle
    if (mm_G) args.G = mm_G;
    // madmaxThreadMultiplier
    if (mm_K) args.K = mm_K;
    // 'ramplot' or 'diskplot'
    if (plot_type) args.plot_type = plot_type;
    // bladebitDisableNUMA
    if (bb_disable_numa) args.m = bb_disable_numa;
    // bladebitWarmStart
    if (bb_warm_start) args.w = bb_warm_start;
    // bladebitNoCpuAffinity
    if (bb_no_cpu_affinity) args.no_cpu_affinity = bb_no_cpu_affinity;
    // bladebitDiskCache
    if (bbdisk_cache) args.cache = `${bbdisk_cache}G`;
    // bladebitDiskF1Threads
    if (bbdisk_f1_threads) args.f1_threads = bbdisk_f1_threads;
    // bladebitDiskFpThreads
    if (bbdisk_fp_threads) args.fp_threads = bbdisk_fp_threads;
    // bladebitDiskCThreads
    if (bbdisk_c_threads) args.c_threads = bbdisk_c_threads;
    // bladebitDiskP2Threads
    if (bbdisk_p2_threads) args.p2_threads = bbdisk_p2_threads;
    // bladebitDiskP3Threads
    if (bbdisk_p3_threads) args.p3_threads = bbdisk_p3_threads;
    // bladebitDiskAlternate
    if (bbdisk_alternate) args.alternate = bbdisk_alternate;
    // bladebitDiskNoT1Direct
    if (bbdisk_no_t1_direct) args.no_t1_direct = bbdisk_no_t1_direct;
    // bladebitDiskNoT2Direct
    if (bbdisk_no_t2_direct) args.no_t2_direct = bbdisk_no_t2_direct;

    return this.command('start_plotting', args, undefined, undefined, true);
  }

  exit() {
    return this.command('exit');
  }

  onKeyringStatusChanged(callback: (data: any, message: Message) => void, processData?: (data: any) => any) {
    return this.onStateChanged('keyring_status_changed', callback, processData);
  }

  getVersion() {
    return this.command('get_version');
  }
}

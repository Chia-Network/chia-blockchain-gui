import api, { store, useGetKeysQuery, useGetLoggedInFingerprintQuery } from '@chia-network/api-react';
import { useAuth } from '@chia-network/core';
import debug from 'debug';
import JSONbig from 'json-bigint';

import waitForWalletSync from '../util/waitForWalletSync';

import useCommandMetadata from './useCommandMetadata';
import useWalletConnectPairs from './useWalletConnectPairs';
import useWalletConnectPreferences from './useWalletConnectPreferences';

const log = debug('chia-gui:walletConnectCommand');

// `chia_logIn` opts out of the renderer's per-command fingerprint check
// (it IS a fingerprint switch — of course it targets a different one).
// Hardcoded here because it's the only command with that exception.
const LOG_IN = 'chia_logIn';

export default function useWalletConnectCommand() {
  const { logIn } = useAuth();
  const { data: currentFingerprint, isLoading: isLoadingLoggedInFingerprint } = useGetLoggedInFingerprintQuery();
  const { getPairBySession } = useWalletConnectPairs();
  const { data: keys } = useGetKeysQuery({});
  const { byWc: commandsByWc, isLoading: isLoadingMetadata } = useCommandMetadata();

  const { allowConfirmationFingerprintChange } = useWalletConnectPreferences();

  const isLoading = isLoadingLoggedInFingerprint || isLoadingMetadata;

  async function handleProcess(
    topic: string,
    requestedCommand: string,
    requestedParams: any,
    ctx: { mainnet: boolean },
  ) {
    const { fingerprint } = requestedParams;

    // Every WC command — including `chia_showNotification` and
    // `chia_requestPermissions` — flows through `dispatchAsPair`. Main
    // owns the gate (pair.commands check), the action (daemon RPC,
    // notification emit, or no-op), and the response.
    const allFingerprints = requestedCommand === LOG_IN;
    const hasCurrentFingerprint = currentFingerprint !== undefined && currentFingerprint !== null;
    const isDifferentFingerprint = hasCurrentFingerprint && fingerprint !== currentFingerprint;
    if (!allFingerprints) {
      if (isDifferentFingerprint && !allowConfirmationFingerprintChange) {
        throw new Error(`Invalid fingerprint ${fingerprint}`);
      }
    }

    // auto login before execute command
    if (isDifferentFingerprint && allowConfirmationFingerprintChange) {
      log('Changing fingerprint', fingerprint);
      await logIn(fingerprint);
    }

    // wait for sync (per-command flag from main's commandRegistry).
    const meta = commandsByWc.get(requestedCommand);
    if (meta?.requiresSync) {
      log('Waiting for sync');
      await waitForWalletSync();

      if (!allFingerprints) {
        const fingerprintRequest = store.dispatch(
          api.endpoints.getLoggedInFingerprint.initiate(undefined, { forceRefetch: true }),
        );
        try {
          const latestFingerprint = await fingerprintRequest.unwrap();
          if (latestFingerprint !== fingerprint) {
            throw new Error('Fingerprint changed during execution');
          }
        } finally {
          fingerprintRequest.unsubscribe();
        }
      }
    }

    log('Executing', requestedCommand, requestedParams);
    const pair = getPairBySession(topic);
    if (!pair) {
      throw new Error('Invalid session topic');
    }

    // Dapp commands take the IPC-direct path: main owns the principal,
    // the permission flow, the spend commit, the wire envelope, the
    // response correlation, AND any per-command display enrichment shown
    // in the Confirm dialog. The renderer hands over (wcCommand, data,
    // topic) and awaits the result. Anything the user sees at confirmation
    // time is computed by main from `data` (via daemon RPCs for asset
    // names, offer summaries, NFT thumbnails) so a compromised renderer
    // can't lie about what's being asked.
    //
    // Main resolves the daemon destination + RPC name from the registry —
    // the renderer is no longer trusted to claim them. Default values
    // (e.g. `wallet_id: 1` for wallet commands) are also applied by main
    // from the schema, so the renderer no longer pre-processes params.
    const labelFor = (fp?: number): string | undefined => {
      if (fp === undefined) return undefined;
      const found = keys?.find((k: { fingerprint: number; label?: string | null }) => k.fingerprint === fp);
      return found?.label ?? undefined;
    };

    // IPC structured clone walks own properties and ships BigNumber's
    // internal `{s, e, c}` shape rather than calling `toJSON`. Round-trip
    // through `JSONbig` (the same serializer `Message.ts` uses for the
    // daemon socket) so any BigNumber-typed values flatten to wire-safe
    // strings, and any BigInt-sized integers from a dapp survive the
    // trip back without precision loss.
    const wireValues = JSONbig.parse(JSONbig.stringify(requestedParams));

    const result = await window.permissionsAPI.dispatchAsPair({
      wcCommand: requestedCommand,
      data: wireValues,
      topic: pair.topic,
      mainnet: ctx.mainnet,
      fingerprint: {
        requested: fingerprint,
        current: hasCurrentFingerprint ? currentFingerprint : undefined,
        requestedLabel: labelFor(fingerprint),
        currentLabel: hasCurrentFingerprint ? labelFor(currentFingerprint) : undefined,
      },
    });
    log('Result', result);

    return result;
  }

  return {
    isLoading,
    process: handleProcess,
  };
}

import api, { store, useGetKeysQuery, useGetLoggedInFingerprintQuery } from '@chia-network/api-react';
import { useAuth } from '@chia-network/core';
import debug from 'debug';
import JSONbig from 'json-bigint';

import { WcError, WcErrorCode } from '../@types/WcError';
import waitForWalletSync from '../util/waitForWalletSync';

import useCommandMetadata from './useCommandMetadata';
import useWalletConnectPreferences from './useWalletConnectPreferences';

const log = debug('chia-gui:walletConnectCommand');

// chia_logIn IS the fingerprint switch, so it skips the per-command check.
const LOG_IN = 'chia_logIn';

export default function useWalletConnectCommand() {
  const { logIn } = useAuth();
  const { data: currentFingerprint, isLoading: isLoadingLoggedInFingerprint } = useGetLoggedInFingerprintQuery();
  const { data: keys } = useGetKeysQuery({});
  const { byWc: commandsByWc, isLoading: isLoadingMetadata } = useCommandMetadata();

  const { allowConfirmationFingerprintChange } = useWalletConnectPreferences();

  const isLoading = isLoadingLoggedInFingerprint || isLoadingMetadata;

  async function handleProcess(
    /** Pair topic, not session topic — translated upstream in processSessionRequest. */
    pairTopic: string,
    requestedCommand: string,
    requestedParams: any,
    ctx: { mainnet: boolean },
  ) {
    const { fingerprint } = requestedParams;

    const allFingerprints = requestedCommand === LOG_IN;
    const hasCurrentFingerprint = currentFingerprint !== undefined && currentFingerprint !== null;
    const isDifferentFingerprint = hasCurrentFingerprint && fingerprint !== currentFingerprint;
    if (!allFingerprints) {
      if (isDifferentFingerprint && !allowConfirmationFingerprintChange) {
        throw new WcError(`Invalid fingerprint ${fingerprint}`, WcErrorCode.UNAUTHORIZED_METHOD);
      }
    }

    // auto login before execute command
    if (isDifferentFingerprint && allowConfirmationFingerprintChange) {
      log('Changing fingerprint', fingerprint);
      await logIn(fingerprint);
    }

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
            throw new WcError('Fingerprint changed during execution', WcErrorCode.INTERNAL_ERROR);
          }
        } finally {
          fingerprintRequest.unsubscribe();
        }
      }
    }

    log('Executing', requestedCommand, requestedParams);

    const labelFor = (fp?: number): string | undefined => {
      if (fp === undefined) return undefined;
      const found = keys?.find((k: { fingerprint: number; label?: string | null }) => k.fingerprint === fp);
      return found?.label ?? undefined;
    };

    // IPC structured clone ignores BigNumber.toJSON; round-trip through
    // JSONbig (same as Message.ts) so values flatten to wire-safe strings.
    const wireValues = JSONbig.parse(JSONbig.stringify(requestedParams));

    const result = await window.permissionsAPI.dispatchAsPair({
      wcCommand: requestedCommand,
      data: wireValues,
      topic: pairTopic,
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

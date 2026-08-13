import api, { store, useGetLoggedInFingerprintQuery } from '@chia-network/api-react';
import debug from 'debug';
import JSONbig from 'json-bigint';

import { WcError, WcErrorCode } from '../@types/WcError';
import waitForWalletSync from '../util/waitForWalletSync';

const log = debug('chia-gui:walletConnectCommand');
const JSONbigNative = JSONbig({ useNativeBigInt: true });

export default function useWalletConnectCommand() {
  const { data: currentFingerprint, isLoading } = useGetLoggedInFingerprintQuery();

  async function handleProcess(
    pairTopic: string,
    command: string,
    params: Record<string, unknown> & { fingerprint?: number },
    ctx: { mainnet: boolean },
  ) {
    const { fingerprint } = params;

    // verify if pair exists
    const pair = await window.permissionsAPI.findPair(pairTopic);
    if (!pair) {
      throw new WcError(`Pair not found`, WcErrorCode.INTERNAL_ERROR);
    }

    if (ctx.mainnet !== pair.mainnet) {
      throw new WcError(`Network mismatch`, WcErrorCode.UNSUPPORTED_CHAINS);
    }

    // verify if pair allows the requested command
    if (!pair.commands.includes(command)) {
      throw new WcError(`Command not allowed for this pair`, WcErrorCode.UNAUTHORIZED_METHOD);
    }

    // verify if pair allows the requested fingerprint
    const requestedFingerprint = fingerprint ?? currentFingerprint;
    if (
      typeof requestedFingerprint !== 'number' ||
      !requestedFingerprint ||
      requestedFingerprint !== pair.fingerprint ||
      currentFingerprint !== pair.fingerprint
    ) {
      throw new WcError(`Fingerprint not allowed for this command`, WcErrorCode.UNAUTHORIZED_METHOD);
    }

    // verify if command is supported
    const commandMetadata = await window.permissionsAPI.getCommandMetadata(command);
    if (!commandMetadata) {
      throw new WcError(`Command not found`, WcErrorCode.METHOD_NOT_FOUND);
    }

    if (commandMetadata.requiresSync) {
      log('Waiting for sync');
      await waitForWalletSync();

      const fingerprintRequest = store.dispatch(
        api.endpoints.getLoggedInFingerprint.initiate(undefined, { forceRefetch: true }),
      );

      try {
        const fingerprintAfterSync = await fingerprintRequest.unwrap();

        // verify if current fingerprint after sync is still correct
        const requestedFingerprintAfterSync = fingerprint ?? fingerprintAfterSync;
        if (
          typeof requestedFingerprintAfterSync !== 'number' ||
          !requestedFingerprintAfterSync ||
          requestedFingerprintAfterSync !== pair.fingerprint ||
          fingerprintAfterSync !== pair.fingerprint
        ) {
          throw new WcError(`Fingerprint not allowed for this command`, WcErrorCode.UNAUTHORIZED_METHOD);
        }

        if (fingerprint && fingerprint !== fingerprintAfterSync) {
          throw new WcError(`Fingerprint not allowed for this command`, WcErrorCode.INTERNAL_ERROR);
        }
      } finally {
        fingerprintRequest.unsubscribe();
      }
    }

    const commandParams = {
      ...params,
    };

    // remove old waitForConfirmation - back compatibility, we are using requiresSync instead
    if ('waitForConfirmation' in commandParams) {
      delete commandParams.waitForConfirmation;
    }

    log('Executing', command, commandParams);

    const result = await window.permissionsAPI.dispatchAsPair({
      topic: pairTopic,
      command,
      params: JSONbig.stringify(commandParams),
    });

    // parse result to object
    const resultObject = JSONbigNative.parse(result);

    log('Result', resultObject);
    return resultObject;
  }

  return {
    isLoading,
    process: handleProcess,
  };
}

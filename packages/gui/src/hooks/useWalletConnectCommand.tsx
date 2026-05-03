import api, {
  store,
  useGetKeysQuery,
  useGetLoggedInFingerprintQuery,
  useGetOfferSummaryMutation,
} from '@chia-network/api-react';
import { useOpenDialog, useAuth } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import debug from 'debug';
import React from 'react';

import type Notification from '../@types/Notification';
import type Pair from '../@types/Pair';
import type WalletConnectCommandParam from '../@types/WalletConnectCommandParam';
import WalletConnectRequestPermissionsConfirmDialog from '../components/walletConnect/WalletConnectRequestPermissionsConfirmDialog';
import NotificationType from '../constants/NotificationType';
import walletConnectCommands from '../constants/WalletConnectCommands';
import {
  type DappCommandDisplay,
  buildCatDisplay,
  buildCreateOfferDisplay,
  buildTakeOfferDisplay,
  enrichOfferNfts,
  nftIdToCoinId,
} from '../util/dappCommandDisplay';
import prepareWalletConnectCommand from '../util/prepareWalletConnectCommand';
import waitForWalletSync from '../util/waitForWalletSync';

import useAssetIdName from './useAssetIdName';
import useWalletConnectPairs from './useWalletConnectPairs';
import useWalletConnectPreferences from './useWalletConnectPreferences';

const log = debug('chia-gui:walletConnectCommand');

function camelToSnake(name: string): string {
  return name.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

type UseWalletConnectCommandOptions = {
  onNotification?: (notification: Notification) => void;
};

function parseNotification(
  fingerprint: number,
  values: Record<string, string | number | boolean>,
  pair: Pair,
): Notification {
  const { type, allFingerprints, offerData } = values;

  const from = pair.metadata?.name ?? <Trans>Unknown Dapp</Trans>;
  const timestamp = Math.floor(new Date().getTime() / 1000);
  const fingerprints = allFingerprints ? pair.fingerprints : [fingerprint];

  const base = {
    from,
    timestamp,
    fingerprints,
  };

  const uniqueRandomId = `wc-${new Date().getTime()}-${Math.floor(Math.random() * 1_000_000_000)}`;

  if (type === NotificationType.OFFER) {
    if (!offerData) {
      throw new Error('Notification missing offerData');
    }

    return {
      ...base,
      type,
      source: 'WALLET_CONNECT',
      id: uniqueRandomId,
      offerData: offerData.toString(),
    };
  }

  if (type === NotificationType.ANNOUNCEMENT && 'message' in values) {
    return {
      ...base,
      type,
      source: 'WALLET_CONNECT',
      id: uniqueRandomId,
      message: values.message.toString(),
      url: 'url' in values ? values.url.toString() : undefined,
    };
  }

  throw new Error(`Invalid notification type ${type}`);
}

export default function useWalletConnectCommand(options: UseWalletConnectCommandOptions) {
  const { onNotification } = options;
  const openDialog = useOpenDialog();
  const { logIn } = useAuth();
  const { data: currentFingerprint, isLoading: isLoadingLoggedInFingerprint } = useGetLoggedInFingerprintQuery();
  const { getPairBySession } = useWalletConnectPairs();
  const { lookupByWalletId } = useAssetIdName();
  const [getOfferSummary] = useGetOfferSummaryMutation();
  const { data: keys } = useGetKeysQuery({});

  const { allowConfirmationFingerprintChange } = useWalletConnectPreferences();

  const isLoading = isLoadingLoggedInFingerprint;

  async function confirm(props: {
    topic: string;
    params: WalletConnectCommandParam[];
    values: Record<string, any>;
    fingerprint: number;
    isDifferentFingerprint: boolean;
    command: string;
    onChange: (values: Record<string, any>) => void;
  }) {
    const { topic, params = [], values, fingerprint, isDifferentFingerprint, command, onChange } = props;

    const pair = getPairBySession(topic);
    if (!pair) {
      throw new Error('Invalid session topic');
    }

    // Pair-local "remember my choice" shortcut. Kept for backward compat with
    // existing pair entries; the toggle that writes to bypassCommands lived on
    // the (now-removed) WalletConnectConfirmDialog, so no new entries get
    // added through this path until that surface is reintroduced in main.
    if (pair.bypassCommands && command in pair.bypassCommands) {
      log(`bypassing command ${command} with value ${pair.bypassCommands[command]}`);
      return pair.bypassCommands[command];
    }

    // requestPermissions is a meta-command: it sets up `bypassCommands` rather
    // than invoking a daemon RPC, so it has its own renderer-side dialog and
    // never reaches dispatchAsPair.
    if (command === 'requestPermissions') {
      if (!values.commands || values.commands.some((cmd: string) => cmd === 'requestPermissions')) {
        return false;
      }
      const { bypassCommands } = pair;
      const hasPermissions = !!bypassCommands && values.commands.every((cmd: string) => bypassCommands[cmd]);
      if (hasPermissions) {
        return true;
      }
      await window.appAPI.focusWindow();
      const isConfirmed = await openDialog(
        <WalletConnectRequestPermissionsConfirmDialog
          topic={topic}
          fingerprint={fingerprint}
          isDifferentFingerprint={isDifferentFingerprint}
          params={params}
          values={values}
          onChange={onChange}
        />,
      );
      return isConfirmed;
    }

    // Everything else: trust dispatchAsPair to run resolvePermission and
    // surface main's Confirm dialog when approval is needed. No renderer-side
    // dialog — that was the source of the duplicate-confirmation bug.
    return true;
  }

  async function handleProcess(topic: string, requestedCommand: string, requestedParams: any) {
    const {
      command,
      values: defaultValues,
      definition,
    } = prepareWalletConnectCommand(walletConnectCommands, requestedCommand, requestedParams);

    const { fingerprint } = requestedParams;

    if (command === 'showNotification') {
      const pair = getPairBySession(topic);
      if (!pair) {
        throw new Error('Invalid session topic');
      }

      const notification = parseNotification(fingerprint, defaultValues, pair);
      onNotification?.(notification);

      return {
        success: true,
      };
    }

    // validate fingerprint for current command
    const { allFingerprints, waitForSync } = definition;
    const hasCurrentFingerprint = currentFingerprint !== undefined && currentFingerprint !== null;
    const isDifferentFingerprint = hasCurrentFingerprint && fingerprint !== currentFingerprint;
    if (!allFingerprints) {
      if (isDifferentFingerprint && !allowConfirmationFingerprintChange) {
        throw new Error(`Invalid fingerprint ${fingerprint}`);
      }
    }

    const { service, params: definitionParams = [], serviceCommand } = definition;

    log('Confirm arguments', definitionParams);

    let values = defaultValues;

    function handleChangeParam(newValues: Record<string, any>) {
      values = newValues;
    }

    const confirmed = await confirm({
      topic,
      params: definitionParams,
      values,
      fingerprint,
      isDifferentFingerprint,
      command,
      onChange: handleChangeParam,
    });

    if (!confirmed) {
      throw new Error(`User cancelled command ${requestedCommand}`);
    }

    // auto login before execute command
    if (isDifferentFingerprint && allowConfirmationFingerprintChange) {
      log('Changing fingerprint', fingerprint);
      await logIn(fingerprint);
    }

    // wait for sync
    if (waitForSync) {
      log('Waiting for sync');
      // wait for wallet synchronisation
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

    if (service === 'EXECUTE') {
      const { execute } = definition;
      const result = typeof execute === 'function' ? await execute(values) : execute;

      return {
        success: true,
        ...result,
      };
    }

    // execute command
    log('Executing', command, values);
    const pair = getPairBySession(topic);
    if (!pair) {
      throw new Error('Invalid session topic');
    }

    // 'NOTIFICATION' is handled at the top of this function (showNotification
    // branch); 'EXECUTE' was just handled above. Anything else is a real
    // ServiceNameValue carrying an RPC.
    if (service === 'NOTIFICATION') {
      throw new Error(`Unexpected NOTIFICATION service for command ${command}`);
    }

    // Build the GUI-only enrichment that main's Confirm dialog needs but
    // can't compute itself (no Redux, no RTK cache, no asset registry inside
    // the sandboxed dialog window). The renderer has all that state, so we
    // resolve here and pass a pre-formatted snapshot. `display` never reaches
    // the daemon — main consumes it for rendering and drops it on send.
    const rpcCommand = camelToSnake(serviceCommand ?? command);
    const display: DappCommandDisplay = {};
    if (rpcCommand === 'cat_spend') {
      display.cat = buildCatDisplay(values, lookupByWalletId);
    } else if (rpcCommand === 'create_offer_for_ids') {
      display.offer = buildCreateOfferDisplay(values, lookupByWalletId);
    } else if (rpcCommand === 'take_offer' && typeof values.offer === 'string') {
      try {
        const summary = await getOfferSummary({ offerData: values.offer }).unwrap();
        // Skip DataLayer offers — they don't carry the offered/requested map
        // we use here. Falls back to no display, dialog still renders the rest.
        const record = (summary as { summary?: unknown }).summary;
        if (record && typeof record === 'object' && 'offered' in record && 'requested' in record) {
          display.offer = buildTakeOfferDisplay(
            record as Parameters<typeof buildTakeOfferDisplay>[0],
            values.fee as number | string | undefined,
          );
        }
      } catch (err) {
        log('Failed to fetch offer summary for display', err);
      }
    }

    // Enrich NFT lines with a thumbnail data URI when the local wallet knows
    // the NFT (e.g. you're offering one you own). Best effort — NFTs not in
    // the wallet won't resolve, the dialog just shows the bech32 id instead.
    if (display.offer) {
      await enrichOfferNfts(display.offer, async (line) => {
        const coinId = nftIdToCoinId(line.nftId);
        if (!coinId) return undefined;
        const promise = store.dispatch(api.endpoints.getNFTInfo.initiate({ coinId }));
        try {
          const nft = (await promise.unwrap()) as { dataUris?: string[] } | undefined;
          const previewUrl = nft?.dataUris?.[0];
          return previewUrl ? { previewUrl } : undefined;
        } catch {
          return undefined;
        } finally {
          promise.unsubscribe();
        }
      });
    }

    // Dapp commands take the IPC-direct path: main owns the principal, the
    // permission flow, the spend commit, the wire envelope, and the response
    // correlation. The renderer just hands over (destination, command, data,
    // topic) and awaits the result. Crucially the renderer shares no
    // request-dispatch infrastructure with UI calls (RTK Query / Client /
    // WebSocketBridge), so there is no shared async context for a dapp
    // principal to leak through onto unrelated polling.
    const labelFor = (fp?: number): string | undefined => {
      if (fp === undefined) return undefined;
      const found = keys?.find((k: { fingerprint: number; label?: string | null }) => k.fingerprint === fp);
      return found?.label ?? undefined;
    };
    const result = await window.permissionsAPI.dispatchAsPair({
      destination: service,
      command: rpcCommand,
      data: values,
      display,
      topic: pair.topic,
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

import {
  ConnectionState,
  ServiceHumanName,
  ServiceName,
  ServiceNameValue,
  PassphrasePromptReason,
} from '@chia-network/api';
import {
  useCloseMutation,
  useGetStateQuery,
  useGetKeyringStatusQuery,
  useServices,
  useGetVersionQuery,
} from '@chia-network/api-react';
import {
  Flex,
  LayoutHero,
  LayoutLoading,
  Mode,
  useMode,
  useIsSimulator,
  useAppVersion,
  useCurrencyCode,
} from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Typography, Collapse } from '@mui/material';
import isElectron from 'is-electron';
import React, { useState, useEffect, ReactNode, useMemo } from 'react';

import ModeServices, { SimulatorServices } from '../../constants/ModeServices';
import useEnableDataLayerService from '../../hooks/useEnableDataLayerService';
import useEnableFilePropagationServer from '../../hooks/useEnableFilePropagationServer';
import useNFTMetadataLRU from '../../hooks/useNFTMetadataLRU';

import AppAutoLogin from './AppAutoLogin';
import AppKeyringMigrator from './AppKeyringMigrator';
import AppPassPrompt from './AppPassPrompt';
import AppSelectMode from './AppSelectMode';
import AppVersionWarning from './AppVersionWarning';

const ALL_SERVICES = [
  ServiceName.WALLET,
  ServiceName.FULL_NODE,
  ServiceName.FARMER,
  ServiceName.HARVESTER,
  ServiceName.SIMULATOR,
  ServiceName.DATALAYER,
  ServiceName.DATALAYER_SERVER,
];

type Props = {
  children: ReactNode;
};

export default function AppState(props: Props) {
  const { children } = props;
  const [close] = useCloseMutation();
  const [closing, setClosing] = useState<boolean>(false);
  const { data: clientState = {}, isLoading: isClientStateLoading } = useGetStateQuery();
  const { data: keyringStatus, isLoading: isLoadingKeyringStatus } = useGetKeyringStatusQuery();
  const [mode] = useMode();
  const isSimulator = useIsSimulator();
  const [enableDataLayerService] = useEnableDataLayerService();
  const [enableFilePropagationServer] = useEnableFilePropagationServer();
  // NOTE: We only start the DL at launch time for now
  const [isDataLayerEnabled] = useState(enableDataLayerService);
  const [isFilePropagationServerEnabled] = useState(enableFilePropagationServer);
  const [versionDialog, setVersionDialog] = useState<boolean>(true);
  const { data: backendVersion } = useGetVersionQuery();
  const { version } = useAppVersion();
  const lru = useNFTMetadataLRU();
  const isTestnet = useCurrencyCode() === 'TXCH';

  const runServices = useMemo<ServiceNameValue[] | undefined>(() => {
    if (mode) {
      const services: ServiceNameValue[] = isSimulator ? SimulatorServices : ModeServices[mode];

      if (isDataLayerEnabled) {
        if (!services.includes(ServiceName.DATALAYER)) {
          services.push(ServiceName.DATALAYER);
        }

        // File propagation server is dependent on the datalayer
        if (isFilePropagationServerEnabled && !services.includes(ServiceName.DATALAYER_SERVER)) {
          services.push(ServiceName.DATALAYER_SERVER);
        }
      }

      return services;
    }

    return undefined;
  }, [mode, isSimulator, isDataLayerEnabled, isFilePropagationServerEnabled]);

  const isKeyringReady = !!keyringStatus && !keyringStatus.isKeyringLocked;

  const servicesState = useServices(ALL_SERVICES, {
    keepRunning: !closing ? runServices : [],
    disabled: !isKeyringReady,
  });

  const allServicesRunning = useMemo<boolean>(() => {
    if (!runServices) {
      return false;
    }

    const specificRunningServiceStates = servicesState.running.filter((serviceName) =>
      runServices.includes(serviceName),
    );

    return specificRunningServiceStates.length === runServices.length;
  }, [servicesState, runServices]);

  const isConnected = !isClientStateLoading && clientState?.state === ConnectionState.CONNECTED;

  useEffect(() => {
    const allRunningServices = servicesState.running.map((serviceState) => serviceState.service);
    const nonWalletServiceRunning = allRunningServices.some((service) => service !== ServiceName.WALLET);

    if (mode === Mode.WALLET && !nonWalletServiceRunning) {
      window.appAPI.setPromptOnQuit(false);
    } else {
      window.appAPI.setPromptOnQuit(true);
    }
  }, [mode, servicesState]);

  useEffect(() => {
    async function handleClose() {
      if (closing) {
        return;
      }

      setClosing(true);

      await close({
        force: true,
      }).unwrap();

      window.appAPI.daemonExited();
    }

    if (isElectron()) {
      const unsubscribe = window.appAPI.subscribeToExitDaemon(handleClose);

      // Handle files/URLs opened at launch now that the app is ready
      window.appAPI.processLaunchTasks();

      return () => {
        unsubscribe();
      };
    }
    return undefined;
  }, [close, closing, lru, isTestnet]);

  if (closing) {
    return (
      <LayoutLoading hideSettings>
        <Flex flexDirection="column" gap={2}>
          <Typography variant="body1" align="center">
            <Trans>Closing down services</Trans>
          </Typography>
          <Flex flexDirection="column" gap={0.5}>
            {servicesState.running.map((service) => (
              <Collapse key={service} in timeout={{ enter: 0, exit: 1000 }}>
                <Typography variant="body1" color="textSecondary" align="center">
                  {ServiceHumanName[service]}
                </Typography>
              </Collapse>
            ))}
          </Flex>
        </Flex>
      </LayoutLoading>
    );
  }

  if (backendVersion && version && versionDialog === true) {
    // backendVersion can be in the format of 1.6.1, 1.7.0b3, or 1.7.0b3.dev123
    // version can be in the format of 1.6.1, 1.7.0b3, 1.7.0-b2.dev123, or 1.7.0b3-dev123

    const backendVersionClean = backendVersion.replace(/[-+.]/g, '');
    const guiVersionClean = version.replace(/[-+.]/g, '');

    if (backendVersionClean !== guiVersionClean && process.env.NODE_ENV !== 'development') {
      return (
        <LayoutHero>
          <AppVersionWarning backV={backendVersion} guiV={version} setVersionDialog={setVersionDialog} />
        </LayoutHero>
      );
    }
  }

  if (isLoadingKeyringStatus || !keyringStatus) {
    return (
      <LayoutLoading>
        <Typography variant="body1">
          <Trans>Loading keyring status</Trans>
        </Typography>
      </LayoutLoading>
    );
  }

  const { needsMigration, isKeyringLocked } = keyringStatus;
  if (needsMigration) {
    return (
      <LayoutHero>
        <AppKeyringMigrator />
      </LayoutHero>
    );
  }

  if (isKeyringLocked) {
    return (
      <LayoutHero>
        <AppPassPrompt reason={PassphrasePromptReason.KEYRING_LOCKED} />
      </LayoutHero>
    );
  }

  if (!isConnected) {
    const { attempt } = clientState;
    return (
      <LayoutLoading>
        {!attempt ? (
          <Typography variant="body1" align="center">
            <Trans>Connecting to daemon</Trans>
          </Typography>
        ) : (
          <Flex flexDirection="column" gap={1}>
            <Typography variant="body1" align="center">
              <Trans>Connecting to daemon</Trans>
            </Typography>
            <Typography variant="body1" align="center" color="textSecondary">
              <Trans>Attempt {attempt}</Trans>
            </Typography>
          </Flex>
        )}
      </LayoutLoading>
    );
  }

  if (!mode) {
    return (
      <LayoutHero maxWidth="md">
        <AppSelectMode />
      </LayoutHero>
    );
  }

  if (!allServicesRunning) {
    return (
      <LayoutLoading>
        <Flex flexDirection="column" gap={2}>
          <Typography variant="body1" align="center">
            <Trans>Starting services</Trans>
          </Typography>
          <Flex flexDirection="column" gap={0.5}>
            {!!runServices &&
              runServices.map((service) => (
                <Collapse
                  key={service}
                  in={!servicesState.running.includes(service)}
                  timeout={{ enter: 0, exit: 1000 }}
                >
                  <Typography variant="body1" color="textSecondary" align="center">
                    {ServiceHumanName[service]}
                  </Typography>
                </Collapse>
              ))}
          </Flex>
        </Flex>
      </LayoutLoading>
    );
  }

  return <AppAutoLogin>{children}</AppAutoLogin>;
}

// AppState.whyDidYouRender = {
//   logOnDifferentValues: true,
// };

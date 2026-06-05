import {
  useGetBlockchainStateQuery,
  useGetFullNodeConnectionsQuery,
  useGetNewFarmingInfoQuery,
  useGetTotalHarvestersSummaryQuery,
} from '@chia-network/api-react';
import { FormatBytes, FormatLargeNumber, mojoToChiaLocaleString, useCurrencyCode, useLocale } from '@chia-network/core';
import {
  Contacts as ContactsIcon,
  Farm as FarmIcon,
  FullNode as FullNodeIcon,
  Harvest as HarvestIcon,
  NFTs as NFTsIcon,
  Offers as OffersIcon,
  Plots as PlotsIcon,
  Pooling as PoolingIcon,
  Settings as SettingsIcon,
  Tokens as TokensIcon,
  VC as VCIcon,
} from '@chia-network/icons';
import { Trans } from '@lingui/macro';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import { Box, Card, CardActionArea, CardContent, LinearProgress, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import useStandardWallet from '../../hooks/useStandardWallet';

const quickStatus = [
  {
    label: <Trans>Wallets</Trans>,
    detail: <Trans>Balances, send, receive, transactions</Trans>,
    to: '/dashboard/wallets',
    icon: TokensIcon,
    iconScale: 1.15,
    key: 'Wallets',
  },
  {
    label: <Trans>Full Node</Trans>,
    detail: <Trans>Sync, peers, block inspection</Trans>,
    to: '/dashboard/fullnode',
    icon: FullNodeIcon,
    key: 'Full Node',
  },
  {
    label: <Trans>Farm</Trans>,
    detail: <Trans>Farming status and rewards</Trans>,
    to: '/dashboard/farm',
    icon: FarmIcon,
    key: 'Farm',
  },
  {
    label: <Trans>Plots</Trans>,
    detail: <Trans>Plot count, size, and add flow</Trans>,
    to: '/dashboard/plot',
    icon: PlotsIcon,
    key: 'Plots',
  },
];

const preservedAreas = [
  {
    label: <Trans>NFTs</Trans>,
    detail: <Trans>Gallery and detail pages</Trans>,
    to: '/dashboard/nfts',
    icon: NFTsIcon,
  },
  {
    label: <Trans>Offers</Trans>,
    detail: <Trans>Create, import, inspect, manage</Trans>,
    to: '/dashboard/offers',
    icon: OffersIcon,
  },
  {
    label: <Trans>Credentials</Trans>,
    detail: <Trans>Verifiable credentials</Trans>,
    to: '/dashboard/vc',
    icon: VCIcon,
    iconScale: 1.2,
  },
  {
    label: <Trans>Contacts</Trans>,
    detail: <Trans>Address book</Trans>,
    to: '/dashboard/addressbook',
    icon: ContactsIcon,
  },
  {
    label: <Trans>Harvest</Trans>,
    detail: <Trans>Harvester overview</Trans>,
    to: '/dashboard/harvest',
    icon: HarvestIcon,
  },
  { label: <Trans>Pool</Trans>, detail: <Trans>Pooling controls</Trans>, to: '/dashboard/pool', icon: PoolingIcon },
  {
    label: <Trans>Tools</Trans>,
    detail: <Trans>Logs and diagnostics</Trans>,
    to: '/dashboard/chiatools',
    icon: BuildOutlinedIcon,
  },
  {
    label: <Trans>Settings</Trans>,
    detail: <Trans>Preferences and services</Trans>,
    to: '/dashboard/settings/general',
    icon: SettingsIcon,
  },
];

function OverviewCardIcon(props: { icon: React.ElementType; scale?: number }) {
  const { icon: Icon, scale = 1 } = props;
  const size = 22 * scale;

  return (
    <Icon
      sx={{
        width: size,
        height: size,
        fontSize: size,
        display: 'block',
      }}
    />
  );
}

function OverviewCard(props: {
  label: React.ReactNode;
  value?: React.ReactNode;
  detail: React.ReactNode;
  to: string;
  icon: React.ElementType;
  iconScale?: number;
  progress?: number;
}) {
  const { label, value, detail, to, icon, iconScale, progress } = props;
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardActionArea onClick={() => navigate(to)} sx={{ height: '100%' }}>
        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) auto',
              gap: 1.5,
              alignItems: 'start',
            }}
          >
            <Box sx={{ minWidth: 0, pr: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                {label}
              </Typography>
              {value && (
                <Typography
                  variant="h6"
                  fontWeight={800}
                  sx={{ mt: 0.25, lineHeight: 1.25, overflowWrap: 'anywhere', wordBreak: 'break-word' }}
                >
                  {value}
                </Typography>
              )}
            </Box>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme.palette.primary.main,
                background: alpha(theme.palette.primary.main, 0.13),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.28)}`,
                flexShrink: 0,
              }}
            >
              <OverviewCardIcon icon={icon} scale={iconScale} />
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
            {detail}
          </Typography>
          {progress !== undefined && (
            <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 4 }} />
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

function useFormattedXCHBalance() {
  const { wallet, walletBalance, loading, error } = useStandardWallet();
  const currencyCode = (useCurrencyCode() ?? 'XCH').toUpperCase();
  const [locale] = useLocale();

  if (loading) {
    return {
      value: <Trans>Loading</Trans>,
      detail: <Trans>Reading standard wallet balance</Trans>,
    };
  }

  if (error) {
    return {
      value: <Trans>Unavailable</Trans>,
      detail: <Trans>Wallet balance service did not respond</Trans>,
    };
  }

  if (!wallet) {
    return {
      value: <Trans>No wallet</Trans>,
      detail: <Trans>Standard wallet is not available</Trans>,
    };
  }

  if (!walletBalance) {
    return {
      value: <Trans>Pending</Trans>,
      detail: <Trans>Waiting for balance data</Trans>,
    };
  }

  const confirmed = mojoToChiaLocaleString(walletBalance.confirmedWalletBalance ?? 0, locale);
  const spendable = mojoToChiaLocaleString(walletBalance.spendableBalance ?? 0, locale);

  return {
    value: `${confirmed} ${currencyCode}`,
    detail: (
      <Trans>
        Spendable {spendable} {currencyCode}
      </Trans>
    ),
  };
}

function useFormattedFullNodeStatus() {
  const {
    data: state,
    isLoading,
    error,
  } = useGetBlockchainStateQuery(
    {},
    {
      pollingInterval: 10_000,
    },
  );
  const { data: connections = [], isLoading: isLoadingConnections } = useGetFullNodeConnectionsQuery();
  const sync = state?.sync;

  if (isLoading) {
    return {
      value: <Trans>Loading</Trans>,
      detail: <Trans>Reading full node status</Trans>,
    };
  }

  if (error) {
    return {
      value: <Trans>Unavailable</Trans>,
      detail: <Trans>Full node service did not respond</Trans>,
    };
  }

  if (sync?.syncMode) {
    return {
      value: <Trans>Syncing</Trans>,
      detail: (
        <>
          <Trans>Height</Trans> <FormatLargeNumber value={sync.syncProgressHeight} /> /{' '}
          <FormatLargeNumber value={sync.syncTipHeight} />
        </>
      ),
    };
  }

  const peers = isLoadingConnections ? <Trans>peers loading</Trans> : `${connections.length} peers`;
  const peakHeight = state?.peak?.height;

  return {
    value: sync?.synced ? <Trans>Synced</Trans> : <Trans>Not synced</Trans>,
    detail:
      peakHeight === undefined ? (
        peers
      ) : (
        <>
          <Trans>Peak</Trans> <FormatLargeNumber value={peakHeight} /> · {peers}
        </>
      ),
  };
}

function useFormattedPlotStatus() {
  const { plots, totalPlotSize, harvesters, initializedHarvesters, isLoading, error } =
    useGetTotalHarvestersSummaryQuery();

  if (isLoading) {
    return {
      value: <Trans>Loading</Trans>,
      detail: <Trans>Reading harvester summary</Trans>,
    };
  }

  if (error) {
    return {
      value: <Trans>Unavailable</Trans>,
      detail: <Trans>Harvester summary did not respond</Trans>,
    };
  }

  return {
    value: (
      <>
        <FormatLargeNumber value={plots} /> <Trans>plots</Trans>
      </>
    ),
    detail: (
      <>
        <FormatBytes value={totalPlotSize} precision={3} /> · {initializedHarvesters}/{harvesters}{' '}
        <Trans>harvesters</Trans>
      </>
    ),
  };
}

function useFormattedFarmStatus() {
  const { data, isLoading, error } = useGetNewFarmingInfoQuery();

  if (isLoading) {
    return {
      value: <Trans>Loading</Trans>,
      detail: <Trans>Reading recent farming attempts</Trans>,
    };
  }

  if (error) {
    return {
      value: <Trans>Unavailable</Trans>,
      detail: <Trans>Farming info did not respond</Trans>,
    };
  }

  const latest = data?.newFarmingInfo?.[0];

  if (!latest) {
    return {
      value: <Trans>No attempts</Trans>,
      detail: <Trans>No recent plot filter attempts found</Trans>,
    };
  }

  return {
    value: latest.proofs > 0 ? <Trans>Proof found</Trans> : <Trans>Checking plots</Trans>,
    detail: (
      <Trans>
        {latest.passedFilter} / {latest.totalPlots} plots passed filter
      </Trans>
    ),
  };
}

export default function DashboardOverview() {
  const xchBalance = useFormattedXCHBalance();
  const fullNodeStatus = useFormattedFullNodeStatus();
  const plotStatus = useFormattedPlotStatus();
  const farmStatus = useFormattedFarmStatus();
  const liveStatusByKey: Record<string, { value: React.ReactNode; detail: React.ReactNode }> = {
    Wallets: xchBalance,
    'Full Node': fullNodeStatus,
    Farm: farmStatus,
    Plots: plotStatus,
  };
  const statusCards = quickStatus.map((item) => ({
    ...item,
    ...liveStatusByKey[item.key],
  }));

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2, mb: 2 }}>
        {statusCards.map((item) => (
          <OverviewCard
            key={item.key}
            label={item.label}
            value={item.value}
            detail={item.detail}
            to={item.to}
            icon={item.icon}
            iconScale={item.iconScale}
          />
        ))}
      </Box>

      <Card variant="outlined">
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
            <Trans>More areas</Trans>
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 1.5 }}>
            {preservedAreas.map((item) => (
              <OverviewCard key={item.to} {...item} />
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

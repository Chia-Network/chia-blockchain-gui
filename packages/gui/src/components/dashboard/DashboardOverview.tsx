import {
  useGetBlockchainStateQuery,
  useGetFullNodeConnectionsQuery,
  useGetNewFarmingInfoQuery,
  useGetTotalHarvestersSummaryQuery,
} from '@chia-network/api-react';
import { FormatBytes, FormatLargeNumber, mojoToChiaLocaleString, useCurrencyCode, useLocale } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import {
  AccountBalanceWallet,
  Agriculture,
  BlurOn,
  BuildOutlined,
  Contacts,
  FactCheck,
  GridView,
  Hub,
  Inventory2,
  LocalOffer,
  Settings,
} from '@mui/icons-material';
import { Box, Button, Card, CardActionArea, CardContent, Chip, LinearProgress, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import useStandardWallet from '../../hooks/useStandardWallet';

const quickStatus = [
  {
    label: <Trans>Wallets</Trans>,
    detail: <Trans>Balances, send, receive, transactions</Trans>,
    to: '/dashboard/wallets',
    icon: AccountBalanceWallet,
    key: 'Wallets',
  },
  {
    label: <Trans>Full Node</Trans>,
    detail: <Trans>Sync, peers, block inspection</Trans>,
    to: '/dashboard/fullnode',
    icon: Hub,
    key: 'Full Node',
  },
  {
    label: <Trans>Farm</Trans>,
    detail: <Trans>Farming status and rewards</Trans>,
    to: '/dashboard/farm',
    icon: Agriculture,
    key: 'Farm',
  },
  {
    label: <Trans>Plots</Trans>,
    detail: <Trans>Plot count, size, and add flow</Trans>,
    to: '/dashboard/plot',
    icon: BlurOn,
    key: 'Plots',
  },
];

const preservedAreas = [
  {
    label: <Trans>NFTs</Trans>,
    detail: <Trans>Gallery and detail pages</Trans>,
    to: '/dashboard/nfts',
    icon: GridView,
  },
  {
    label: <Trans>Offers</Trans>,
    detail: <Trans>Create, import, inspect, manage</Trans>,
    to: '/dashboard/offers',
    icon: LocalOffer,
  },
  {
    label: <Trans>Credentials</Trans>,
    detail: <Trans>Verifiable credentials</Trans>,
    to: '/dashboard/vc',
    icon: FactCheck,
  },
  { label: <Trans>Contacts</Trans>, detail: <Trans>Address book</Trans>, to: '/dashboard/addressbook', icon: Contacts },
  {
    label: <Trans>Harvest</Trans>,
    detail: <Trans>Harvester overview</Trans>,
    to: '/dashboard/harvest',
    icon: Inventory2,
  },
  { label: <Trans>Pool</Trans>, detail: <Trans>Pooling controls</Trans>, to: '/dashboard/pool', icon: Inventory2 },
  {
    label: <Trans>Tools</Trans>,
    detail: <Trans>Logs and diagnostics</Trans>,
    to: '/dashboard/chiatools',
    icon: BuildOutlined,
  },
  {
    label: <Trans>Settings</Trans>,
    detail: <Trans>Preferences and services</Trans>,
    to: '/dashboard/settings/general',
    icon: Settings,
  },
];

function OverviewCard(props: {
  label: React.ReactNode;
  value?: React.ReactNode;
  detail: React.ReactNode;
  to: string;
  icon: React.ElementType;
  progress?: number;
}) {
  const { label, value, detail, to, icon: Icon, progress } = props;
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardActionArea onClick={() => navigate(to)} sx={{ height: '100%' }}>
        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Box minWidth={0}>
              <Typography variant="body2" color="text.secondary">
                {label}
              </Typography>
              {value && (
                <Typography variant="h5" fontWeight={800} sx={{ mt: 0.25 }}>
                  {value}
                </Typography>
              )}
            </Box>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 1,
                display: 'grid',
                placeItems: 'center',
                color: theme.palette.primary.main,
                background: alpha(theme.palette.primary.main, 0.13),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.28)}`,
                flexShrink: 0,
              }}
            >
              <Icon fontSize="small" />
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
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="overline" color="text.secondary">
            <Trans>Dashboard</Trans>
          </Typography>
          <Typography variant="h4" fontWeight={900} sx={{ mt: 0.5 }}>
            <Trans>Overview</Trans>
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720, mt: 1 }}>
            <Trans>
              Daily Chia checks in one place: wallet, node, farm, plots, offers, NFTs, pool, tools, and settings stay
              one click away.
            </Trans>
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
            <Chip label={<Trans>All original pages preserved</Trans>} size="small" color="primary" variant="outlined" />
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2, mb: 2 }}>
        {statusCards.map((item) => (
          <OverviewCard
            key={item.key}
            label={item.label}
            value={item.value}
            detail={item.detail}
            to={item.to}
            icon={item.icon}
          />
        ))}
      </Box>

      <Card variant="outlined">
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight={800}>
                <Trans>More areas</Trans>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <Trans>Overview adds a front door; original pages stay intact.</Trans>
              </Typography>
            </Box>
            <Button variant="contained" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <Trans>Top</Trans>
            </Button>
          </Box>
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

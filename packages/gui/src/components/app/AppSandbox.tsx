import { resolveAppTheme, ThemeProvider, useDarkMode, useThemeVariant } from '@chia-network/core';
import { Overview as OverviewIcon } from '@chia-network/icons';
import {
  AccountBalanceWallet,
  Agriculture,
  BarChart,
  BlurOn,
  Bolt,
  Contacts,
  DeviceThermostat,
  FactCheck,
  GridView,
  Hub,
  Inventory2,
  LocalOffer,
  Palette,
  Search,
  Settings,
  Storage,
  VerifiedUser,
  WaterDrop,
} from '@mui/icons-material';
import {
  AppBar,
  Box,
  Button,
  Chip,
  CssBaseline,
  Drawer,
  IconButton,
  LinearProgress,
  Toolbar,
  Typography,
} from '@mui/material';
import { alpha, styled, useTheme } from '@mui/material/styles';
import React, { useMemo, useState } from 'react';

import GuiThemeAssetsProvider from '../../theme/GuiThemeAssetsProvider';

const drawerWidth = 124;

const navItems = [
  { label: 'Overview', icon: OverviewIcon },
  { label: 'Wallets', icon: AccountBalanceWallet },
  { label: 'NFTs', icon: GridView },
  { label: 'Offers', icon: LocalOffer },
  { label: 'Credentials', icon: FactCheck },
  { label: 'Contacts', icon: Contacts },
  { label: 'Full Node', icon: Hub },
  { label: 'Farm', icon: Agriculture },
  { label: 'Plots', icon: BlurOn },
  { label: 'Harvest', icon: Storage },
  { label: 'Pool', icon: Inventory2 },
  { label: 'Tools', icon: DeviceThermostat },
  { label: 'Settings', icon: Settings },
];

const StyledRoot = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  color: theme.palette.text.primary,
  backgroundColor: '#f4f0e5',
  backgroundImage: [
    'linear-gradient(118deg, rgba(244, 240, 229, 0.96) 0%, rgba(237, 229, 207, 0.92) 38%, rgba(226, 235, 227, 0.94) 100%)',
    'repeating-linear-gradient(102deg, rgba(158, 117, 47, 0.1) 0 18px, rgba(63, 99, 72, 0.09) 18px 34px, transparent 34px 68px)',
  ].join(','),
}));

const StyledDrawer = styled(Drawer)(() => ({
  width: drawerWidth,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: drawerWidth,
    borderRight: `1px solid ${alpha('#473a24', 0.18)}`,
    background: 'linear-gradient(180deg, rgba(38, 51, 41, 0.97) 0%, rgba(51, 55, 44, 0.98) 100%)',
    color: '#f7efd8',
  },
}));

const StyledMain = styled(Box)(() => ({
  marginLeft: drawerWidth,
  minHeight: '100vh',
}));

const Surface = styled(Box)(({ theme }) => ({
  border: `1px solid ${alpha('#473a24', 0.14)}`,
  background: alpha(theme.palette.background.paper, 0.82),
  borderRadius: 8,
  boxShadow: `0 18px 54px ${alpha('#473a24', 0.1)}`,
}));

const FieldMap = styled(Box)(() => ({
  position: 'relative',
  overflow: 'hidden',
  minHeight: 178,
  borderRadius: 8,
  border: `1px solid ${alpha('#473a24', 0.14)}`,
  backgroundColor: '#c99837',
  backgroundImage: [
    'linear-gradient(180deg, rgba(137, 170, 184, 0.7) 0%, rgba(236, 221, 174, 0.42) 42%, rgba(173, 111, 44, 0.46) 100%)',
    'repeating-linear-gradient(112deg, rgba(92, 107, 60, 0.78) 0 10px, rgba(219, 176, 77, 0.74) 10px 24px, rgba(122, 72, 42, 0.24) 24px 30px)',
  ].join(','),
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: 14,
    border: `1px solid ${alpha('#fff7de', 0.48)}`,
    borderRadius: 6,
  },
}));

function NavButton({
  label,
  icon: Icon,
  active,
  onSelect,
}: {
  label: string;
  icon: React.ElementType;
  active?: boolean;
  onSelect: () => void;
}) {
  return (
    <Box
      component="button"
      type="button"
      style={{
        width: 88,
        height: 64,
        margin: '4px 12px',
        border: active ? `1px solid ${alpha('#e6b756', 0.7)}` : '1px solid transparent',
        borderRadius: 8,
        cursor: 'pointer',
        color: active ? '#fff3cf' : alpha('#f7efd8', 0.68),
        background: active
          ? 'linear-gradient(180deg, rgba(199, 137, 42, 0.36) 0%, rgba(46, 78, 54, 0.34) 100%)'
          : 'transparent',
        boxShadow: active ? `0 10px 28px ${alpha('#0f1a12', 0.26)}` : 'none',
      }}
      onClick={onSelect}
    >
      <Icon fontSize="small" />
      <Typography variant="caption" display="block" sx={{ mt: 0.5, fontWeight: active ? 700 : 500 }}>
        {label}
      </Typography>
    </Box>
  );
}

function PagePreview({ page }: { page: string }) {
  const theme = useTheme();
  const rows = [
    'Primary content area keeps the original Chia function reachable.',
    'Tables, forms, dialogs, and actions inherit the updated surface style.',
    'No daemon, wallet, keyring, or chain request is made in this preview.',
  ];

  return (
    <>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '0.78fr 1.22fr' }, gap: 2, mb: 2 }}>
        <Surface sx={{ p: 2.5, minHeight: 178 }}>
          <Typography variant="overline" color="text.secondary">
            No-daemon page preview
          </Typography>
          <Typography variant="h4" fontWeight={800} sx={{ mt: 0.25 }}>
            {page}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 620, mt: 1 }}>
            This is a visual stand-in for the real {page} page. It lets you check sidebar flow, spacing, card density,
            button tone, and the light theme before replacing the installed GUI.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
            <Chip label="connection detached" size="small" color="primary" variant="outlined" />
            <Chip label="clickable preview" size="small" />
            <Chip label="safe visual test" size="small" />
          </Box>
        </Surface>
        <FieldMap>
          <Box sx={{ position: 'absolute', left: 24, bottom: 22, right: 24, color: '#fff7de' }}>
            <Typography variant="overline" sx={{ opacity: 0.86 }}>
              {page} console strip
            </Typography>
            <Typography variant="h6" fontWeight={800}>
              Light theme applied
            </Typography>
          </Box>
        </FieldMap>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2, mb: 2 }}>
        {['Status', 'Action', 'History', 'Alerts'].map((label, index) => (
          <Surface key={label} sx={{ p: 2, minHeight: 120 }}>
            <Typography variant="body2" color="text.secondary">
              {page} {label}
            </Typography>
            <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
              {index === 0 ? 'Ready' : index === 1 ? 'Available' : index === 2 ? 'Sample rows' : 'None'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Mocked display for layout review.
            </Typography>
          </Surface>
        ))}
      </Box>

      <Surface sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {page} layout motion
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Representative rows for the real page surface.
            </Typography>
          </Box>
          <Button variant="contained" size="small">
            Mock action
          </Button>
        </Box>
        {rows.map((item, index) => (
          <Box key={item} sx={{ py: 1.5, borderTop: `1px solid ${alpha(theme.palette.text.primary, 0.1)}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip label={`0${index + 1}`} size="small" variant="outlined" />
              <Box flexGrow={1}>
                <Typography variant="body1" fontWeight={600}>
                  {item}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Preview-only row. Real Chia logic stays outside this browser sandbox.
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={45 + index * 18}
                sx={{ width: 140, height: 6, borderRadius: 4 }}
              />
            </Box>
          </Box>
        ))}
      </Surface>
    </>
  );
}

function SandboxScreen() {
  const theme = useTheme();
  const [selectedPage, setSelectedPage] = useState('Overview');
  const metrics = [
    { label: 'Field Balance', value: '1,248.42 XCH', detail: 'Mock display data', icon: AccountBalanceWallet },
    { label: 'North Ridge Node', value: 'Synced', detail: 'Height 6,427,108', icon: VerifiedUser },
    { label: 'Active Plots', value: '42 active', detail: 'ETA 18 days', icon: BarChart },
    { label: 'Console Mode', value: 'UI only', detail: 'No daemon calls', icon: Palette },
  ];
  const overviewSections = [
    { label: 'Wallets', value: '1,248.42 XCH', detail: 'Spendable balance, pending tx, address tools' },
    { label: 'Offers', value: '3 drafts', detail: 'Create, import, inspect, and manage offers' },
    { label: 'NFTs', value: '18 items', detail: 'Gallery, detail view, metadata, incoming offers' },
    { label: 'Credentials', value: 'Enabled', detail: 'Verifiable credentials remain available' },
    { label: 'Full Node', value: 'Synced', detail: 'Height, peers, blocks, and chain status' },
    { label: 'Farm', value: 'Active', detail: 'Rewards, challenges, and farming status' },
    { label: 'Plots', value: '42 plots', detail: 'Plot inventory and add-plot flow' },
    { label: 'Harvest', value: 'Ready', detail: 'Harvester overview and plot add shortcut' },
    { label: 'Pool', value: 'Connected', detail: 'Pool overview, join, change, and absorb rewards' },
    { label: 'Tools', value: 'Logs', detail: 'Diagnostics and local GUI tools stay reachable' },
  ];

  return (
    <StyledRoot>
      <StyledDrawer variant="permanent">
        <Box sx={{ pt: 3 }}>
          {navItems.map((item) => (
            <NavButton
              key={item.label}
              {...item}
              active={item.label === selectedPage}
              onSelect={() => setSelectedPage(item.label)}
            />
          ))}
        </Box>
      </StyledDrawer>
      <StyledMain>
        <AppBar
          position="sticky"
          elevation={0}
          color="transparent"
          sx={{
            borderBottom: `1px solid ${alpha(theme.palette.text.primary, 0.12)}`,
            backdropFilter: 'blur(18px)',
            background: alpha('#f4f0e5', 0.76),
          }}
        >
          <Toolbar sx={{ minHeight: 84, gap: 2, px: 3 }}>
            <Box flexGrow={1} minWidth={0}>
              <Typography variant="overline" color="text.secondary">
                Chia GUI design sandbox / Overview first
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {selectedPage === 'Overview' ? 'Overview' : selectedPage}
              </Typography>
            </Box>
            <Surface sx={{ px: 1.25, py: 0.75, display: 'flex', alignItems: 'center', gap: 1, minWidth: 260 }}>
              <Search fontSize="small" color="disabled" />
              <Typography variant="body2" color="text.secondary">
                Search GUI functions
              </Typography>
            </Surface>
            <Chip color="primary" label="daemon detached" size="small" variant="outlined" />
            <IconButton color="primary">
              <Bolt />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: 3 }}>
          {selectedPage === 'Overview' ? (
            <>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '0.95fr 1.05fr' }, gap: 2, mb: 2 }}>
                <Surface sx={{ p: 2.5, minHeight: 178 }}>
                  <Typography variant="overline" color="text.secondary">
                    Unified status screen
                  </Typography>
                  <Typography variant="h4" fontWeight={800} sx={{ mt: 0.25 }}>
                    Dashboard overview
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 560, mt: 1 }}>
                    A single first screen for daily checks: wallet, node, farm, plots, offers, NFTs, pool, tools, and
                    settings stay visible without removing any original function.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                    <Chip icon={<Agriculture />} label="rice field amber" size="small" />
                    <Chip icon={<WaterDrop />} label="morning frost blue" size="small" />
                    <Chip icon={<DeviceThermostat />} label="low heat console" size="small" />
                  </Box>
                </Surface>
                <FieldMap>
                  <Box sx={{ position: 'absolute', left: 24, bottom: 22, right: 24, color: '#fff7de' }}>
                    <Typography variant="overline" sx={{ opacity: 0.86 }}>
                      Status monitor
                    </Typography>
                    <Typography variant="h6" fontWeight={800}>
                      North valley rows online
                    </Typography>
                  </Box>
                </FieldMap>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2, mb: 2 }}>
                {metrics.map(({ label, value, detail, icon: Icon }) => (
                  <Surface key={label} sx={{ p: 2, minHeight: 116 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {label}
                        </Typography>
                        <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>
                          {value}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {detail}
                        </Typography>
                      </Box>
                      <Icon color="primary" />
                    </Box>
                  </Surface>
                ))}
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.35fr 0.65fr' }, gap: 2 }}>
                <Surface sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>
                        Console activity
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Static sample content for color, spacing, and density checks.
                      </Typography>
                    </Box>
                    <Button variant="contained" size="small">
                      Mock offer
                    </Button>
                  </Box>
                  {['Harvest lane sync', 'Offer ledger spacing', 'Gallery row density', 'Plot rhythm check'].map(
                    (item, index) => (
                      <Box
                        key={item}
                        sx={{ py: 1.5, borderTop: `1px solid ${alpha(theme.palette.text.primary, 0.1)}` }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Chip label={`0${index + 1}`} size="small" variant="outlined" />
                          <Box flexGrow={1}>
                            <Typography variant="body1" fontWeight={600}>
                              {item}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              UI-only row. Safe to restyle without touching wallet or chain logic.
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={35 + index * 16}
                            sx={{ width: 140, height: 6, borderRadius: 4 }}
                          />
                        </Box>
                      </Box>
                    ),
                  )}
                </Surface>

                <Surface sx={{ p: 2.5 }}>
                  <Typography variant="h6" fontWeight={700}>
                    Preserved functions
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                    The left tags stay conventional, and the overview acts as a launch console instead of replacing
                    feature pages.
                  </Typography>
                  <Box sx={{ display: 'grid', gap: 1 }}>
                    {overviewSections.slice(0, 5).map((item) => (
                      <Box
                        key={item.label}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 1.5,
                          py: 1,
                          borderTop: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
                        }}
                      >
                        <Typography variant="body2" fontWeight={700}>
                          {item.label}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.value}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Surface>
              </Box>

              <Surface sx={{ p: 2.5, mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 2, mb: 1.5 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      All original areas
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Orthodox labels remain available from the sidebar; this overview only shortens the first check.
                    </Typography>
                  </Box>
                  <Chip label="no function removed" color="primary" size="small" variant="outlined" />
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 1.5 }}>
                  {overviewSections.map((item) => (
                    <Box
                      key={item.label}
                      sx={{
                        minHeight: 94,
                        p: 1.5,
                        borderRadius: 1,
                        border: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
                        background: alpha('#fffaf0', 0.58),
                      }}
                    >
                      <Typography variant="body2" fontWeight={800}>
                        {item.label}
                      </Typography>
                      <Typography variant="h6" fontWeight={800} sx={{ mt: 0.25 }}>
                        {item.value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.detail}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Surface>
            </>
          ) : (
            <PagePreview page={selectedPage} />
          )}
        </Box>
      </StyledMain>
    </StyledRoot>
  );
}

export default function AppSandbox() {
  const { isDarkMode } = useDarkMode();
  const { themeVariant } = useThemeVariant();
  const theme = useMemo(() => resolveAppTheme(themeVariant, isDarkMode), [themeVariant, isDarkMode]);

  return (
    <ThemeProvider theme={theme} fonts global>
      <GuiThemeAssetsProvider>
        <CssBaseline />
        <SandboxScreen />
      </GuiThemeAssetsProvider>
    </ThemeProvider>
  );
}

import type { DataLayerOfferSummary, SingletonSummaryRecord } from '@chia-network/api';
import { Color, CopyToClipboard, Flex, Truncate, truncateValue } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import StorageIcon from '@mui/icons-material/Storage';
import VerifiedIcon from '@mui/icons-material/Verified';
import {
  Box,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';

export type DataLayerOfferViewerProps = {
  summary: DataLayerOfferSummary;
};

function StoreUpdateCard({ entry, index }: { entry: SingletonSummaryRecord; index: number }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        borderRadius: 1,
        p: 3,
        backgroundColor: 'background.card',
        border: '1px solid',
        borderColor: theme.palette.mode === 'light' ? Color.Neutral[300] : Color.Neutral[600],
      }}
    >
      <Flex flexDirection="column" gap={2}>
        <Flex alignItems="center" gap={1}>
          <StorageIcon fontSize="small" color="primary" />
          <Typography variant="subtitle2">
            <Trans>Store {index + 1}</Trans>
          </Typography>
        </Flex>

        <Flex flexDirection="row" alignItems="center" gap={1}>
          <Typography variant="body2" color="textSecondary" sx={{ minWidth: 80 }}>
            <Trans>Store ID</Trans>
          </Typography>
          <Chip label={truncateValue(entry.launcherId, {})} size="small" variant="outlined" />
          <CopyToClipboard value={entry.launcherId} />
        </Flex>

        <Flex flexDirection="row" alignItems="center" gap={1}>
          <Typography variant="body2" color="textSecondary" sx={{ minWidth: 80 }}>
            <Trans>New Root</Trans>
          </Typography>
          <Flex alignItems="center" gap={0.5}>
            <ArrowForwardIcon fontSize="small" color="action" />
            <Chip label={truncateValue(entry.newRoot, {})} size="small" color="primary" variant="outlined" />
            <CopyToClipboard value={entry.newRoot} />
          </Flex>
        </Flex>
      </Flex>
    </Box>
  );
}

function RequiredProofsTable({ entries }: { entries: SingletonSummaryRecord[] }) {
  const allDeps = entries.flatMap((entry) =>
    entry.dependencies.map((dep) => ({
      sourceStoreId: entry.launcherId,
      dependsOnStoreId: dep.launcherId,
      valuesToProve: dep.valuesToProve,
    })),
  );

  if (allDeps.length === 0) return null;

  return (
    <Box>
      <Flex alignItems="center" gap={1} sx={{ mb: 1.5 }}>
        <VerifiedIcon fontSize="small" color="info" />
        <Typography variant="subtitle2">
          <Trans>Required Proofs</Trans>
        </Typography>
      </Flex>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        <Trans>
          The following values must be proven to exist in the specified stores before this offer can be accepted.
        </Trans>
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <Trans>For Store Update</Trans>
              </TableCell>
              <TableCell>
                <Trans>Requires Proof From Store</Trans>
              </TableCell>
              <TableCell>
                <Trans>Values to Prove</Trans>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {allDeps.map((dep) => (
              <TableRow key={`${dep.sourceStoreId}-${dep.dependsOnStoreId}`}>
                <TableCell>
                  <Flex alignItems="center" gap={0.5}>
                    <Truncate tooltip>{dep.sourceStoreId}</Truncate>
                    <CopyToClipboard value={dep.sourceStoreId} />
                  </Flex>
                </TableCell>
                <TableCell>
                  <Flex alignItems="center" gap={0.5}>
                    <Truncate tooltip>{dep.dependsOnStoreId}</Truncate>
                    <CopyToClipboard value={dep.dependsOnStoreId} />
                  </Flex>
                </TableCell>
                <TableCell>
                  <Flex flexDirection="column" gap={0.5}>
                    {dep.valuesToProve.map((v) => (
                      <Flex key={v} alignItems="center" gap={0.5}>
                        <Truncate tooltip>{v}</Truncate>
                        <CopyToClipboard value={v} />
                      </Flex>
                    ))}
                  </Flex>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default function DataLayerOfferViewer(props: DataLayerOfferViewerProps) {
  const { summary } = props;

  return (
    <Flex flexDirection="column" gap={3}>
      <Typography variant="h6">
        <Trans>Data Layer Offer</Trans>
      </Typography>
      <Typography variant="body2" color="textSecondary">
        <Trans>
          This offer proposes updates to Data Layer store roots. Accepting it will transition the listed stores to new
          roots. Dependencies specify values that must be proven to exist in other stores before acceptance.
        </Trans>
      </Typography>

      <Divider />

      <Box>
        <Flex alignItems="center" gap={1} sx={{ mb: 1.5 }}>
          <StorageIcon fontSize="small" color="primary" />
          <Typography variant="subtitle1">
            <Trans>Offered Store Updates ({summary.offered.length})</Trans>
          </Typography>
        </Flex>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          <Trans>These stores will have their roots updated to the specified values.</Trans>
        </Typography>
        <Flex flexDirection="column" gap={2}>
          {summary.offered.map((entry, i) => (
            <StoreUpdateCard key={entry.launcherId} entry={entry} index={i} />
          ))}
        </Flex>
      </Box>

      <Divider />

      <RequiredProofsTable entries={summary.offered} />
    </Flex>
  );
}

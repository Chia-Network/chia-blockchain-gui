import React, { useState } from 'react';
import { Trans } from '@lingui/macro';
import { Address, TableControlled, Flex, FormatBytes, Tooltip, StateColor } from '@chia/core';
import { Warning as WarningIcon } from '@mui/icons-material';
import { type Plot } from '@chia/api';
import { useGetHarvesterPlotsQuery, useGetHarvesterQuery } from '@chia/api-react';
import styled from 'styled-components';
import { Box, Typography } from '@mui/material';
import PlotStatus from './PlotStatus';
import PlotAction from './PlotAction';

const StyledWarningIcon = styled(WarningIcon)`
  color: ${StateColor.WARNING};
`;

const cols = [
  {
    field({ fileSize, size, duplicates }: Plot) {
      const hasDuplicates = false;
      const [firstDuplicate] = duplicates || [];

      const duplicateTitle = hasDuplicates ? (
        <Trans>Plot is duplicate of {firstDuplicate.filename}</Trans>
      ) : null;

      return (
        <Flex alignItems="center" gap={1}>
          <Box>
            {`K-${size}, `}
            <FormatBytes value={fileSize} precision={3} />
          </Box>
          {hasDuplicates && (
            <Tooltip title={<Box>{duplicateTitle}</Box>} interactive arrow>
              <StyledWarningIcon />
            </Tooltip>
          )}
        </Flex>
      );
    },
    title: <Trans>K-Size</Trans>,
  },
  {
    minWidth: '100px',
    field: 'plotPublicKey',
    tooltip: 'plotPublicKey',
    title: <Trans>Plot Key</Trans>,
  },
  {
    minWidth: '100px',
    field: 'poolPublicKey',
    tooltip: 'poolPublicKey',
    title: <Trans>Pool Key</Trans>,
  },
  {
    minWidth: '100px',
    field: ({ poolContractPuzzleHash }: Plot) => (
      <Address value={poolContractPuzzleHash} tooltip copyToClipboard>
        {(address) => (
          <Typography variant="body2" noWrap>
            {address}
          </Typography>
        )}
      </Address>
    ),
    title: <Trans>Pool Contract Address</Trans>,
  },
  {
    minWidth: '100px',
    field: 'filename',
    tooltip: 'filename',
    title: <Trans>Filename</Trans>,
  },
  {
    field: (plot: Plot) => <PlotStatus plot={plot} />,
    title: <Trans>Status</Trans>,
  },
  {
    field: (plot: Plot) => <PlotAction plot={plot} />,
    title: <Trans>Action</Trans>,
  },
];

export type PlotHarvesterPlotsProps = {
  peerId: string;
};

export default function PlotHarvesterPlots(props: PlotHarvesterPlotsProps) {
  const { peerId } = props;
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const subPeerId = peerId.substring(2);
  const { plots, isLoading: isLoadingHarvester } = useGetHarvesterQuery({
    peerId,
  });
  const { isLoading: isLoadingHarvesterPlots, data = [] } = useGetHarvesterPlotsQuery({
    peerId: subPeerId,
    page: page + 1,
    pageSize,
  });

  const isLoading = isLoadingHarvester || isLoadingHarvesterPlots;
  const count = plots ?? 0;

  function handlePageChange(rowsPerPage: number, page: number) {
    setPageSize(rowsPerPage);
    setPage(page);
  }

  console.log('data', data);

  return (
    <TableControlled
      cols={cols}
      rows={data}
      rowsPerPageOptions={[5, 10, 25, 50, 100]}
      page={page}
      rowsPerPage={pageSize}
      count={count}
      onPageChange={handlePageChange}
      isLoading={isLoading}
      expandedCellShift={1}
      uniqueField="plotId"
      caption={!plots && (
        <Typography variant="body2" align="center">
          <Trans>No plots yet</Trans>
        </Typography>
      )}
      pages={!!plots}
    />
  );
}

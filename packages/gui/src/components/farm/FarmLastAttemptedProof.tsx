import { useGetNewFarmingInfoQuery } from '@chia-network/api-react';
import { Link, Table, Card } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import moment from 'moment';
import React from 'react';

import type { Row } from '../core/components/Table/Table';
// import usePlots from '../../hooks/usePlots';

const cols = [
  {
    minWidth: '200px',
    field: 'challengeHash',
    tooltip: true,
    title: <Trans>Challenge</Trans>,
  },
  {
    field(row: Row) {
      return `${row.passedFilter} / ${row.totalPlots}`;
    },
    title: <Trans>Plots Passed Filter</Trans>,
  },
  {
    field: 'proofs',
    title: <Trans>Proofs Found</Trans>,
  },
  {
    field(row: Row) {
      return moment(row.timestamp * 1000).format('LLL');
    },
    title: <Trans>Date</Trans>,
  },
];

export default function FarmLastAttemptedProof() {
  // const { size } = usePlots();

  const { data: lastAttemptedProof, isLoading } = useGetNewFarmingInfoQuery();

  const reducedLastAttemptedProof = lastAttemptedProof?.slice(0, 5);
  const isEmpty = !reducedLastAttemptedProof?.length;

  return (
    <Card
      title={<Trans>Last Attempted Proof</Trans>}
      titleVariant="h6"
      tooltip={
        <Trans>
          This table shows you the last time your farm attempted to win a block challenge.{' '}
          <Link
            target="_blank"
            href="https://github.com/Chia-Network/chia-blockchain/wiki/FAQ#what-is-the-plot-filter-and-why-didnt-my-plot-pass-it"
          >
            Learn more
          </Link>
        </Trans>
      }
      transparent
    >
      <Table
        cols={cols}
        rows={reducedLastAttemptedProof}
        isLoading={isLoading}
        caption={
          isEmpty && (
            <>
              <Trans>None of your plots have passed the plot filter yet.</Trans>

              {/* !!size && (
                <>
                  {' '}
                  <Trans>
                    But you are currently farming{' '}
                    <FormatBytes value={size} precision={3} />
                  </Trans>
                </>
              ) */}
            </>
          )
        }
      />
    </Card>
  );
}

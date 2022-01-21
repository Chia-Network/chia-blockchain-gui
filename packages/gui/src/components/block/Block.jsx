import React, { useEffect, useState } from 'react';
import {
  Button,
  Paper,
  TableRow,
  Table,
  TableBody,
  TableCell,
  TableContainer,
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { Trans } from '@lingui/macro';
import { useGetBlockQuery, useGetBlockRecordQuery  } from '@chia/api-react'
import { useParams, useNavigate } from 'react-router-dom';
import {
  Back,
  Card,
  FormatLargeNumber,
  Link,
  Loading,
  TooltipIcon,
  Flex,
  calculatePoolReward,
  calculateBaseFarmerReward,
  useCurrencyCode,
  mojoToChia,
  DashboardTitle,
  Suspender,
} from '@chia/core';
import {
  unix_to_short_date,
  hex_to_array,
  arr_to_hex,
  sha256,
} from '../../util/utils';
import toBech32m from '../../util/toBech32m';
import BlockTitle from './BlockTitle';

/* global BigInt */

async function computeNewPlotId(block) {
  const { poolPublicKey, plotPublicKey } =
    block.rewardChainBlock.proofOfSpace;
  if (!poolPublicKey) {
    return undefined;
  }
  let buf = hex_to_array(poolPublicKey);
  buf = buf.concat(hex_to_array(plotPublicKey));
  const bufHash = await sha256(buf);
  return arr_to_hex(bufHash);
}

export default function Block() {
  const { headerHash } = useParams();
  const navigate = useNavigate();
  const [newPlotId, setNewPlotId] = useState();
  const [nextSubBlocks, setNextSubBlocks] = useState([]);
  const currencyCode = useCurrencyCode();

  const { data: block, isLoading: isLoadingBlock, error: errorBlock } = useGetBlockQuery({
    headerHash,
  });

  const { data: blockRecord, isLoading: isLoadingBlockRecord, error: errorBlockRecord } = useGetBlockRecordQuery({
    headerHash,
  });

  const { data: prevBlockRecord, isLoading: isLoadingPrevBlockRecord, error: errorPrevBlockRecord } = useGetBlockRecordQuery({
    headerHash: blockRecord?.prevHash,
  }, {
    skip: !blockRecord?.prevHash || !blockRecord?.height,
  });


  async function updateNewPlotId(block) {
    if (block) {
      setNewPlotId(await computeNewPlotId(block));
    } else {
      setNewPlotId(undefined);
    }
  }

  useEffect(() => {
    updateNewPlotId(block);
  }, [block]);

  const isLoading = isLoadingBlock || isLoadingBlockRecord || isLoadingPrevBlockRecord;
  const error = errorBlock || errorBlockRecord || errorPrevBlockRecord;


  const hasPreviousBlock = !!blockRecord?.prevHash && !!blockRecord?.height;
  const hasNextBlock = !!nextSubBlocks.length;

  function handleShowPreviousBlock() {
    const prevHash = blockRecord?.prevHash;
    if (prevHash && blockRecord?.height) {
      // save current hash
      setNextSubBlocks([headerHash, ...nextSubBlocks]);

      navigate(`/dashboard/block/${prevHash}`);
    }
  }

  function handleShowNextBlock() {
    const [nextSubBlock, ...rest] = nextSubBlocks;
    if (nextSubBlock) {
      setNextSubBlocks(rest);

      navigate(`/dashboard/block/${nextSubBlock}`);
    }
  }

  if (isLoading) {
    return (
      <>
        <DashboardTitle><Trans>Block</Trans></DashboardTitle>
        <Suspender />
      </>
    );
  }

  if (error) {
    return (
      <>
        <DashboardTitle><Trans>Block</Trans></DashboardTitle>
        <Card
          title={
            <BlockTitle>
              <Trans>Block with hash {headerHash}</Trans>
            </BlockTitle>
          }
        >
          <Alert severity="error">{error.message}</Alert>
        </Card>
      </>
    );
  }

  if (!block) {
    return (
      <>
        <DashboardTitle><Trans>Block</Trans></DashboardTitle>
        <Card
          title={
            <BlockTitle>
              <Trans>Block</Trans>
            </BlockTitle>
          }
        >
          <Alert severity="warning">
            <Trans>Block with hash {headerHash} does not exist.</Trans>
          </Alert>
        </Card>
      </>
    );
  }

  const difficulty =
    prevBlockRecord && blockRecord
      ? blockRecord.weight - prevBlockRecord.weight
      : blockRecord?.weight ?? 0;

  const poolReward = mojoToChia(calculatePoolReward(blockRecord.height));
  const baseFarmerReward = mojoToChia(
    calculateBaseFarmerReward(blockRecord.height),
  );

  const chiaFees = blockRecord.fees !== undefined
    ? mojoToChia(blockRecord.fees)
    : '';

  const rows = [
    {
      name: <Trans>Header hash</Trans>,
      value: blockRecord.headerHash,
    },
    {
      name: <Trans>Timestamp</Trans>,
      value: blockRecord.timestamp
        ? unix_to_short_date(blockRecord.timestamp)
        : null,
      tooltip: (
        <Trans>
          This is the time the block was created by the farmer, which is before
          it is finalized with a proof of time
        </Trans>
      ),
    },
    {
      name: <Trans>Height</Trans>,
      value: <FormatLargeNumber value={blockRecord.height} />,
    },
    {
      name: <Trans>Weight</Trans>,
      value: <FormatLargeNumber value={blockRecord.weight} />,
      tooltip: (
        <Trans>
          Weight is the total added difficulty of all sub blocks up to and
          including this one
        </Trans>
      ),
    },
    {
      name: <Trans>Previous Header Hash</Trans>,
      value: (
        <Link onClick={handleShowPreviousBlock}>{blockRecord.prevHash}</Link>
      ),
    },
    {
      name: <Trans>Difficulty</Trans>,
      value: <FormatLargeNumber value={difficulty} />,
    },
    {
      name: <Trans>Total VDF Iterations</Trans>,
      value: <FormatLargeNumber value={blockRecord.totalIters} />,
      tooltip: (
        <Trans>
          The total number of VDF (verifiable delay function) or proof of time
          iterations on the whole chain up to this sub block.
        </Trans>
      ),
    },
    {
      name: <Trans>Block VDF Iterations</Trans>,
      value: (
        <FormatLargeNumber
          value={
            block.rewardChainBlock.challengeChainIpVdf.numberOfIterations
          }
        />
      ),
      tooltip: (
        <Trans>
          The total number of VDF (verifiable delay function) or proof of time
          iterations on this block.
        </Trans>
      ),
    },
    {
      name: <Trans>Proof of Space Size</Trans>,
      value: (
        <FormatLargeNumber
          value={block.rewardChainBlock.proofOfSpace.size}
        />
      ),
    },
    {
      name: <Trans>Plot Public Key</Trans>,
      value: block.rewardChainBlock.proofOfSpace.plotPublicKey,
    },
    {
      name: <Trans>Pool Public Key</Trans>,
      value: block.rewardChainBlock.proofOfSpace.poolPublicKey,
    },
    {
      name: <Trans>Farmer Puzzle Hash</Trans>,
      value: (
        <Link
          target="_blank"
          href={`https://www.chiaexplorer.com/blockchain/puzzlehash/${blockRecord.farmerPuzzleHash}`}
        >
          {currencyCode
            ? toBech32m(
                blockRecord.farmerPuzzleHash,
                currencyCode.toLowerCase(),
              )
            : ''}
        </Link>
      ),
    },
    {
      name: <Trans>Pool Puzzle Hash</Trans>,
      value: (
        <Link
          target="_blank"
          href={`https://www.chiaexplorer.com/blockchain/puzzlehash/${blockRecord.poolPuzzleHash}`}
        >
          {currencyCode
            ? toBech32m(
                blockRecord.poolPuzzleHash,
                currencyCode.toLowerCase(),
              )
            : ''}
        </Link>
      ),
    },
    {
      name: <Trans>Plot Id</Trans>,
      value: newPlotId,
      tooltip: (
        <Trans>
          The seed used to create the plot. This depends on the pool pk and plot
          pk.
        </Trans>
      ),
    },
    {
      name: <Trans>Transactions Filter Hash</Trans>,
      value: block.foliageTransactionBlock?.filterHash,
    },
    {
      name: <Trans>Pool Reward Amount</Trans>,
      value: `${poolReward} ${currencyCode}`,
    },
    {
      name: <Trans>Base Farmer Reward Amount</Trans>,
      value: `${baseFarmerReward} ${currencyCode}`,
    },
    {
      name: <Trans>Fees Amount</Trans>,
      value: chiaFees ? `${chiaFees} ${currencyCode}` : '',
      tooltip: (
        <Trans>
          The total transactions fees in this block. Rewarded to the farmer.
        </Trans>
      ),
    },
  ];

  return (
    <>
      <DashboardTitle><Trans>Block</Trans></DashboardTitle>
      <Card
        title={
          <Back variant="h5">
            <Trans>
              Block at height {blockRecord.height} in the Chia blockchain
            </Trans>
          </Back>
        }
        action={
          <Flex gap={1}>
            <Button
              onClick={handleShowPreviousBlock}
              disabled={!hasPreviousBlock}
            >
              <Trans>Previous</Trans>
            </Button>
            <Button onClick={handleShowNextBlock} disabled={!hasNextBlock}>
              <Trans>Next</Trans>
            </Button>
          </Flex>
        }
      >
        <TableContainer component={Paper}>
          <Table>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={index}>
                  <TableCell component="th" scope="row">
                    {row.name}{' '}
                    {row.tooltip && <TooltipIcon>{row.tooltip}</TooltipIcon>}
                  </TableCell>
                  <TableCell onClick={row.onClick} align="right">
                    {row.value}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </>
  );
}

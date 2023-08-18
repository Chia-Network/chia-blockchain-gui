import { useGetPlotNFTsQuery, usePwSelfPoolMutation, usePwJoinPoolMutation } from '@chia-network/api-react';
import { Flex, State, Loading, StateTypography } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { ChevronRight as ChevronRightIcon } from '@mui/icons-material';
import React, { useMemo, ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router';

import PlotNFTStateEnum from '../../constants/PlotNFTState';
import PlotNFTName from './PlotNFTName';
import PlotNFTSelectPool, { SubmitData } from './select/PlotNFTSelectPool';

type Props = {
  headerTag?: ReactNode;
};

export default function PlotNFTChangePool(props: Props) {
  const { headerTag: HeaderTag } = props;
  const { data, isLoading } = useGetPlotNFTsQuery();
  const [pwSelfPool] = usePwSelfPoolMutation();
  const [pwJoinPool] = usePwJoinPoolMutation();

  const { plotNFTId } = useParams<{
    plotNFTId: string;
  }>();

  const navigate = useNavigate();
  const nft = useMemo(
    () => data?.nfts?.find((nftItem) => nftItem.poolState.p2SingletonPuzzleHash === plotNFTId),
    [data?.nfts, plotNFTId]
  );

  const state = nft?.poolWalletStatus?.current?.state;
  const isDoubleFee = state === PlotNFTStateEnum.FARMING_TO_POOL;

  async function handleSubmit(dataLocal: SubmitData) {
    const walletId = nft?.poolWalletStatus.walletId;

    const {
      initialTargetState: { state: stateLocal, poolUrl, relativeLockHeight, targetPuzzleHash },
      fee,
    } = dataLocal;

    if (walletId === undefined || poolUrl === nft?.poolState.poolConfig.poolUrl) {
      return;
    }

    if (stateLocal === 'SELF_POOLING') {
      await pwSelfPool({
        walletId,
        fee,
      }).unwrap();
    } else {
      await pwJoinPool({
        walletId,
        poolUrl,
        relativeLockHeight,
        targetPuzzlehash: targetPuzzleHash, // pw_join_pool expects 'target_puzzlehash', not 'target_puzzle_hash'
        fee,
      }).unwrap();
    }

    navigate(-1);
    /*
    if (history.length) {
      history.goBack();
    } else {
      navigate('/dashboard/pool');
    }
    */
  }

  if (isLoading) {
    return (
      <Loading>
        <Trans>Preparing Plot NFT</Trans>
      </Loading>
    );
  }

  if (!nft) {
    return <Trans>Plot NFT with p2_singleton_puzzle_hash {plotNFTId} does not exists</Trans>;
  }

  const {
    poolState: {
      poolConfig: { poolUrl },
    },
  } = nft;

  const defaultValues = {
    self: !poolUrl,
    poolUrl,
  };

  return (
    <>
      {HeaderTag && (
        <HeaderTag>
          <Flex alignItems="center">
            <ChevronRightIcon color="secondary" />
            <PlotNFTName nft={nft} variant="h6" />
          </Flex>
        </HeaderTag>
      )}
      <PlotNFTSelectPool
        step={1}
        onSubmit={handleSubmit}
        title={<Trans>Change Pool</Trans>}
        submitTitle={<Trans>Change</Trans>}
        defaultValues={defaultValues}
        feeDescription={
          isDoubleFee && (
            <StateTypography variant="body2" state={State.WARNING}>
              <Trans>Fee is used TWICE: once to leave pool, once to join.</Trans>
            </StateTypography>
          )
        }
      />
    </>
  );
}

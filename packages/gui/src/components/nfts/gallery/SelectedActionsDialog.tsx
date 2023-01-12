import type { NFTInfo } from '@chia/api';
import { t } from '@lingui/macro';
import React from 'react';
import styled from 'styled-components';

import useHiddenNFTs from '../../../hooks/useHiddenNFTs';
import NFTContextualActions, { NFTContextualActionTypes } from '../NFTContextualActions';

const SelectedItemsContainer = styled.div`
  color: #fff;
  background: rgba(0, 0, 0, 0.87);
  box-shadow: 0px 11px 14px -7px rgba(0, 0, 0, 0.2), 0px 23px 36px 3px rgba(0, 0, 0, 0.14),
    0px 9px 44px 8px rgba(0, 0, 0, 0.12);
  border-radius: 16px;
  padding: 12px 32px;
  position: fixed;
  bottom: 50px;
  z-index: 7;
  display: inline-block;
  margin-left: auto;
  margin-right: auto;
`;

const SelectedCountText = styled.div`
  display: inline-block;
  position: relative;
  top: 1px;
`;

const TableWrapper = styled.div`
  display: table;
  > div {
    display: table-cell;
  }
  > div:first-child {
    padding-right: 10px;
  }
`;

type SelectedActionsDialogProps = {
  nfts: NFTInfo[];
  allCount: number;
};

export default function SelectedActionsDialog(props: SelectedActionsDialogProps) {
  const { allCount, nfts } = props;
  const [isNFTHidden] = useHiddenNFTs();
  const showOrHide = nfts.reduce((p, nft) => {
    if (p === 0) return 0;
    const isHidden = isNFTHidden(nft);
    if ((isHidden && p === 2) || (!isHidden && p === 1)) return 0;
    return isHidden ? 1 : 2;
  }, -1);

  const menuWithHide =
    NFTContextualActionTypes.CreateOffer +
    NFTContextualActionTypes.MoveToProfile +
    NFTContextualActionTypes.Invalidate +
    NFTContextualActionTypes.Hide;
  const menuWithoutHide =
    NFTContextualActionTypes.CreateOffer + NFTContextualActionTypes.MoveToProfile + NFTContextualActionTypes.Invalidate;

  return (
    <SelectedItemsContainer>
      <TableWrapper>
        <SelectedCountText>{t`${nfts.length} of ${allCount} items selected:`}</SelectedCountText>
        <NFTContextualActions
          selection={{ items: nfts }}
          availableActions={showOrHide > 0 ? menuWithHide : menuWithoutHide}
          isMultiSelect
          showOrHide={showOrHide}
        />
      </TableWrapper>
    </SelectedItemsContainer>
  );
}

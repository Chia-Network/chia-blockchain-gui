import { WalletType } from '@chia/api';
import type { Wallet } from '@chia/api';
import { useGetWalletsQuery } from '@chia/api-react';
import { Flex, Loading, catToMojo, mojoToCATLocaleString } from '@chia/core';
import { Tokens } from '@chia/icons';
import { Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import React, { useMemo } from 'react';
import { useFieldArray, useWatch } from 'react-hook-form';

import useOfferBuilderContext from '../../hooks/useOfferBuilderContext';
import OfferBuilderSection from './OfferBuilderSection';
import OfferBuilderToken from './OfferBuilderToken';

export type OfferBuilderTokensSectionProps = {
  name: string;
  offering?: boolean;
  muted?: boolean;
};

export default function OfferBuilderTokensSection(props: OfferBuilderTokensSectionProps) {
  const { name, offering, muted } = props;

  const { data: wallets, isLoading: isLoadingWallets } = useGetWalletsQuery();
  const { fields, append, remove } = useFieldArray({
    name,
  });
  const tokens = useWatch({
    name,
  });
  const { requestedRoyalties, offeredRoyalties, isCalculatingRoyalties } = useOfferBuilderContext();
  const loading = isLoadingWallets || isCalculatingRoyalties;

  // Yes, this is correct. Fungible (token) assets used to pay royalties are from the opposite side of the trade.
  const allRoyalties = offering ? requestedRoyalties : offeredRoyalties;

  const [amountWithRoyalties, royaltiesByAssetId] = useMemo(() => {
    if (!allRoyalties) {
      return [];
    }

    const tokenAmountsWithRoyalties: Record<string, BigNumber> = {};
    const royaltiesByAssetId: Record<string, any> = {};
    const assetIds = tokens.map((token) => token.assetId);

    tokens.forEach((token) => {
      tokenAmountsWithRoyalties[token.assetId] = catToMojo(token.amount ?? 0);
    });

    assetIds.map((assetId) => {
      Object.entries(allRoyalties).forEach(([nftId, royaltyPayments]) => {
        const royaltyPayment = royaltyPayments?.find((payment) => payment.asset === assetId);

        if (royaltyPayment) {
          if (!royaltiesByAssetId[assetId]) {
            royaltiesByAssetId[assetId] = [];
          }

          const baseTotal: BigNumber = tokenAmountsWithRoyalties[royaltyPayment.asset];
          const totalAmount = baseTotal.plus(royaltyPayment.amount);

          tokenAmountsWithRoyalties[royaltyPayment.asset] = totalAmount;

          royaltiesByAssetId[assetId].push({
            nftId,
            payment: {
              asset: royaltyPayment.asset,
              amount: royaltyPayment.amount,
              address: royaltyPayment.address,
              displayAmount: mojoToCATLocaleString(royaltyPayment.amount),
            },
          });
        }
      });
    });

    const amountsWithRoyalties: Record<string, string> = {};
    Object.entries(tokenAmountsWithRoyalties).forEach(([assetId, amount]) => {
      amountsWithRoyalties[assetId] = mojoToCATLocaleString(amount);
    });

    return [amountsWithRoyalties, royaltiesByAssetId];
  }, [tokens, allRoyalties]);

  function handleAdd() {
    append({
      amount: '',
      assetId: '',
    });
  }

  function handleRemove(index: number) {
    remove(index);
  }

  const { usedAssetIds } = useOfferBuilderContext();
  const showAdd = useMemo(() => {
    if (!wallets) {
      return false;
    }

    const emptyTokensCount = tokens?.filter((token) => !token.assetId).length ?? 0;

    const catWallets = wallets.filter((wallet: Wallet) => wallet.type === WalletType.CAT);

    const availableTokensCount = catWallets.length - usedAssetIds.length;
    return availableTokensCount > emptyTokensCount;
  }, [wallets, usedAssetIds, tokens]);

  return (
    <OfferBuilderSection
      icon={<Tokens />}
      title={<Trans>Tokens</Trans>}
      subtitle={<Trans>Chia Asset Tokens (CATs) are tokens built on top of XCH</Trans>}
      onAdd={showAdd ? handleAdd : undefined}
      expanded={!!fields.length}
      muted={muted}
    >
      {loading ? (
        <Loading />
      ) : (
        <Flex gap={4} flexDirection="column">
          {fields.map((field, index) => (
            <OfferBuilderToken
              key={field.id}
              name={`${name}.${index}`}
              onRemove={() => handleRemove(index)}
              hideBalance={!offering}
              amountWithRoyalties={amountWithRoyalties?.[tokens[index]?.assetId]}
              royaltyPayments={royaltiesByAssetId?.[tokens[index]?.assetId]}
            />
          ))}
        </Flex>
      )}
    </OfferBuilderSection>
  );
}

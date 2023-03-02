import type { Wallet } from '@chia-network/api';
import { WalletType } from '@chia-network/api';
import { chiaToMojo, catToMojo } from '@chia-network/core';
import { t } from '@lingui/macro';
import BigNumber from 'bignumber.js';

import type Driver from '../@types/Driver';
import type OfferBuilderData from '../@types/OfferBuilderData';
import type { OfferTradeRecordFormatted } from '../hooks/useWalletOffers';
import findCATWalletByAssetId from './findCATWalletByAssetId';
import hasSpendableBalance from './hasSpendableBalance';
import { prepareNFTOfferFromNFTId } from './prepareNFTOffer';

// Amount exceeds spendable balance
export default async function offerBuilderDataToOffer(
  data: OfferBuilderData,
  wallets: Wallet[],
  offers: OfferTradeRecordFormatted[],
  validateOnly?: boolean
): Promise<{
  walletIdsAndAmounts?: Record<string, BigNumber>;
  driverDict?: Record<string, any>;
  feeInMojos: BigNumber;
  validateOnly?: boolean;
}> {
  const {
    offered: { xch: offeredXch = [], tokens: offeredTokens = [], nfts: offeredNfts = [], fee: [firstFee] = [] },
    requested: { xch: requestedXch = [], tokens: requestedTokens = [], nfts: requestedNfts = [] },
  } = data;

  const usedNFTs: string[] = [];

  const feeInMojos = firstFee ? chiaToMojo(firstFee.amount) : new BigNumber(0);

  const walletIdsAndAmounts: Record<string, BigNumber> = {};
  const driverDict: Record<string, Driver> = {};

  const hasOffer = !!offeredXch.length || !!offeredTokens.length || !!offeredNfts.length;

  if (!hasOffer) {
    throw new Error(t`Please specify at least one offered asset`);
  }

  let standardWallet: Wallet | undefined;
  if (offeredXch.length > 0) {
    standardWallet = wallets.find((w) => w.type === WalletType.STANDARD_WALLET);
  }

  const myPendingOffers = offers.filter((o) => o.isMyOffer && o.status === 'PENDING_ACCEPT');
  console.log('abc', myPendingOffers);
  // @TODO Calculate locked coin amounts and check whether to prompt user to cancel existing offers.

  const xchTasks = offeredXch.map(async (xch) => {
    const { amount } = xch;
    if (!amount || amount === '0') {
      throw new Error(t`Please enter an XCH amount`);
    }
    if (!standardWallet) {
      throw new Error(t`No standard wallet found`);
    }

    const mojoAmount = chiaToMojo(amount);
    walletIdsAndAmounts[standardWallet.id] = mojoAmount.negated();

    const hasEnoughBalance = await hasSpendableBalance(standardWallet.id, mojoAmount);
    if (!hasEnoughBalance) {
      throw new Error(t`Amount exceeds XCH spendable balance`);
    }
  });

  const tokenTasks = offeredTokens.map(async (token) => {
    const { assetId, amount } = token;

    if (!assetId) {
      throw new Error(t`Please select an asset for each token`);
    }

    const wallet = findCATWalletByAssetId(wallets, assetId);
    if (!wallet) {
      throw new Error(t`No CAT wallet found for ${assetId} token`);
    }

    if (!amount || amount === '0') {
      throw new Error(t`Please enter an amount for ${wallet.meta?.name} token`);
    }

    const mojoAmount = catToMojo(amount);
    walletIdsAndAmounts[wallet.id] = mojoAmount.negated();

    const hasEnoughBalance = await hasSpendableBalance(wallet.id, mojoAmount);
    if (!hasEnoughBalance) {
      throw new Error(t`Amount exceeds spendable balance for ${wallet.meta?.name} token`);
    }
  });

  const nftTasks = offeredNfts.map(async ({ nftId }) => {
    if (usedNFTs.includes(nftId)) {
      throw new Error(t`NFT ${nftId} is already used in this offer`);
    }
    usedNFTs.push(nftId);

    const { id, amount, driver } = await prepareNFTOfferFromNFTId(nftId, true);

    walletIdsAndAmounts[id] = amount;
    if (driver) {
      driverDict[id] = driver;
    }
  });

  await Promise.all([...xchTasks, ...tokenTasks, ...nftTasks]);

  // requested
  requestedXch.forEach((xch) => {
    const { amount } = xch;

    // For one-sided offers where nothing is requested, we allow the amount to be '0'
    // and skip adding an entry to the walletIdsAndAmounts object.
    //
    // If the amount is blank '', we prompt the user to enter an amount.
    if (amount === '0') {
      return;
    }

    if (!amount) {
      throw new Error(t`Please enter an XCH amount`);
    }

    const wallet = wallets.find((w) => w.type === WalletType.STANDARD_WALLET);
    if (!wallet) {
      throw new Error(t`No standard wallet found`);
    }

    if (wallet.id in walletIdsAndAmounts) {
      throw new Error(t`Cannot offer and request the same asset`);
    }

    walletIdsAndAmounts[wallet.id] = chiaToMojo(amount);
  });

  requestedTokens.forEach((token) => {
    const { assetId, amount } = token;

    if (!assetId) {
      throw new Error(t`Please select an asset for each token`);
    }

    const wallet = findCATWalletByAssetId(wallets, assetId);
    if (!wallet) {
      throw new Error(t`No CAT wallet found for ${assetId} token`);
    }

    if (!amount || amount === '0') {
      throw new Error(t`Please enter an amount for ${wallet.meta?.name} token`);
    }

    walletIdsAndAmounts[wallet.id] = catToMojo(amount);
  });

  await Promise.all(
    requestedNfts.map(async ({ nftId }) => {
      if (usedNFTs.includes(nftId)) {
        throw new Error(t`NFT ${nftId} is already used in this offer`);
      }
      usedNFTs.push(nftId);

      const { id, amount, driver } = await prepareNFTOfferFromNFTId(nftId, false);

      walletIdsAndAmounts[id] = amount;
      if (driver) {
        driverDict[id] = driver;
      }
    })
  );

  return {
    walletIdsAndAmounts,
    driverDict,
    feeInMojos,
    validateOnly,
  };
}

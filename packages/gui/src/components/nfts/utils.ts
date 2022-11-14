import { WalletType } from '@chia/api';
import type { Wallet } from '@chia/api';

/**
 * Locate the NFT "inbox" from a list of NFT wallets. The inbox is the NFT wallet
 * that contains unassigned (no DID set) NFTs. Locating the inbox involves checking
 * whether the NFT wallet has a DID set. Only one NFT wallet can be used for holding
 * unassigned NFTs.
 *
 * @param wallets Wallets
 * @returns NFT inbox or undefined if not found
 */
export function getNFTInbox(wallets: Wallet[] | undefined): Wallet | undefined {
  return wallets
    ?.filter((wallet) => wallet.type === WalletType.NFT)
    .find((nftWallet: Wallet) => !nftWallet.meta?.did);
}

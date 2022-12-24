export enum SignMessageEntityType {
  WalletAddress = 'WALLET_ADDRESS',
  NFT = 'NFT',
  DID = 'DID',
}

export interface SignMessageWalletAddressEntity {
  type: SignMessageEntityType.WalletAddress;
  address: string;
}

export interface SignMessageNFTEntity {
  type: SignMessageEntityType.NFT;
  nftId: string;
}

export interface SignMessageDIDEntity {
  type: SignMessageEntityType.DID;
  didId: string;
}

export type SignMessageEntity = SignMessageWalletAddressEntity | SignMessageNFTEntity | SignMessageDIDEntity;

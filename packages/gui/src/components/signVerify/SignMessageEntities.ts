export enum SignMessageEntityType {
  WalletAddress = 'WALLET_ADDRESS',
  NFT = 'NFT',
  DID = 'DID',
  VC = 'CREDENTIAL',
}

export interface SignMessageWalletAddressEntity {
  type: SignMessageEntityType.WalletAddress;
  address: string;
}

export interface SignMessageNFTEntity {
  type: SignMessageEntityType.NFT;
  nftId: string;
  address: string;
}

export interface SignMessageDIDEntity {
  type: SignMessageEntityType.DID;
  didId: string;
  address: string;
}

export interface SignMessageVCEntity {
  type: SignMessageEntityType.VC;
  vcId: string;
  address: string;
}

export type SignMessageEntity =
  | SignMessageWalletAddressEntity
  | SignMessageNFTEntity
  | SignMessageDIDEntity
  | SignMessageVCEntity;

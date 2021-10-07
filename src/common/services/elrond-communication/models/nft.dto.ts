import { NftMetadata } from './nftMetadata';

export interface Nft {
  collection: string;
  identifier: string;
  name: string;
  type: string;
  owners: ApiAccount[];
  owner: string;
  minted: string;
  burnt: string;
  decimals: number;
  isPaused: boolean;
  canUpgrade: boolean;
  canMint: boolean;
  canBurn: boolean;
  canChangeOwner: boolean;
  canPause: boolean;
  canFreeze: boolean;
  canWipe: boolean;
  canAddSpecialRoles: boolean;
  canTransferNFTCreateRole: boolean;
  wiped: string;
  attributes: string;
  balance: string;
  supply: string;
  creator: string;
  hash: string;
  nonce: number;
  royalties: string;
  timestamp: number;
  uris: string[];
  url: string;
  thumbnailUrl: string;
  tags: string[];
  metadata: NftMetadata;
}

export interface ApiAccount {
  address: string;
  balance: string;
  herotag: string;
}

export interface Nft {
  collection: string;
  identifier: string;
  name: string;
  type: string;
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
  isWhitelistedStorage: boolean;
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
  media: NftMedia[];
  scamInfo: NftScamInfo;
}

export interface NftMedia {
  url: string;
  thumbnailUrl: string;
  fileType: string;
  fileSize;
}

export interface NftScamInfo {
  type: string;
  info: string;
}

export interface NftMetadata {
  description: string;
}

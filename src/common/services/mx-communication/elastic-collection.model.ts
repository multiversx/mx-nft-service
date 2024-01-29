export interface CollectionElastic {
  token: string;
  name: string;
  type: string;
  ticker: string;
  currentOwner: string;
  timestamp: number;
  properties: CollectionElasticProperties;
  api_nftCount: number;
  api_isVerified?: boolean;
}

export interface CollectionElasticProperties {
  canTransferNFTCreateRole: boolean;
  canPause: boolean;
  canFreeze: boolean;
  canWipe: boolean;
  canMint: boolean;
  canBurn: boolean;
  canAddQuantity: boolean;
}

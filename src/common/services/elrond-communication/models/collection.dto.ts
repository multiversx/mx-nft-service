export interface CollectionApi {
  collection: string;
  name: string;
  type: string;
  ticker: string;
  owner: string;
  timestamp: number;
  canTransferRole: boolean;
  canPause: boolean;
  canFreeze: boolean;
  canWipe: boolean;
  canCreate: boolean;
  canBurn: boolean;
  canAddQuantity: boolean;
  roles: RolesApi[];
  assets: CollectionAssetApi;
}

export interface RolesApi {
  address: string;
  roles: string[];
}
export interface CollectionAssetApi {
  website: string;
  description: string;
  status: string;
  pngUrl: string;
  svgUrl: string;
  social: CollectionAssetSocialApi;
}

export interface CollectionAssetSocialApi {
  email: string;
  blog: string;
  twiter: string;
}

import { ScamInfoApi } from './scam-info.dto';

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
  count: number;
  traits: { [key: string]: { [key: string]: number } };
  scamInfo: ScamInfoApi;
}

export interface RolesApi {
  address: string;
  canCreate: boolean;
  canBurn: boolean;
  canAddQuantity: boolean;
  canUpdateAttributes: boolean;
  canAddUri: boolean;
  canTransferRole: boolean;
  roles: string[];
}
export interface CollectionAssetApi {
  website: string;
  description: string;
  status: string;
  pngUrl: string;
  svgUrl: string;
  social: CollectionAssetSocialApi;
  preferredRankAlgorithm: string;
}

export interface CollectionAssetSocialApi {
  email: string;
  blog: string;
  twiter: string;
}

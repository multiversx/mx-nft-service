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
}

export interface RolesApi {
  address: string;
  roles: string[];
}

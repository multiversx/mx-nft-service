export interface CollectionApi {
  collection: string;
  name: string;
  type: string;
  ticker: string;
  issuer: string;
  timestamp: number;
  canTransferRole: boolean;
  canPause: boolean;
  canFreeze: boolean;
  canWipe: boolean;
  canCreate: boolean;
  canBurn: boolean;
  canAddQuantity: boolean;
}

export class ChangedEvent {
  id: any;
  address: string;
  type: CacheEventTypeEnum;
  extraInfo: { [key: string]: string };
  constructor(init?: Partial<ChangedEvent>) {
    Object.assign(this, init);
  }
}

export enum CacheEventTypeEnum {
  OwnerChanged = 'OwnerChanged',
  AssetsRefresh = 'AssetsRefresh',
  Mint = 'Mint',
  UpdateAuction = 'UpdateAuction',
  UpdateOrder = 'UpdateOrder',
  UpdateNotifications = 'UpdateNotifications',
  UpdateOneNotification = 'UpdateOneNotification',
  AssetLike = 'AssetLike',
  FeaturedCollections = 'FeaturedCollections',
  DeleteCacheKeys = 'DeleteCacheKeys',
  SetCacheKey = 'SetCacheKey',
  UpdateOffer = 'UpdateOffer',
  AssetRefresh = 'AssetRefresh',
  ScamUpdate = 'ScamUpdate',
  BlacklistedCollections = 'BlacklistedCollections',
  RefreshTrending = 'RefreshTrending',
  MarkCollection = 'MarkCollection',
  Minters = 'Minters',
  Marketplaces = 'Marketplaces',
  Campaigns = 'Campaigns',
}

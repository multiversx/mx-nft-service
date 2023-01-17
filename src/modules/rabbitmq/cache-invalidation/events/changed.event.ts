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
  OwnerChanged,
  AssetsRefresh,
  Mint,
  UpdateAuction,
  UpdateOrder,
  UpdateNotifications,
  UpdateOneNotification,
  AssetLike,
  FeaturedCollections,
  DeleteCacheKeys,
  SetCacheKey,
  UpdateOffer,
}

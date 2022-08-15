export class ChangedEvent {
  id: any;
  ownerAddress: string;
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
}

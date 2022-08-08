export class ChangedEvent {
  id: any;
  ownerAddress: string;
  type: CacheEventTypeEnum;
  constructor(init?: Partial<ChangedEvent>) {
    Object.assign(this, init);
  }
}

export class BidChangeEvent extends ChangedEvent {
  ownerAddress: string;
  identifier: string;
  constructor(init?: Partial<BidChangeEvent>) {
    super();
    Object.assign(this, init);
  }
}

export enum CacheEventTypeEnum {
  OwnerChanged,
  AssetsRefresh,
  Mint,
  UpdateAuction,
  UpdateOrder,
  BuySft,
  Bid,
}

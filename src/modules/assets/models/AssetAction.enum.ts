import { registerEnumType } from '@nestjs/graphql';

export enum AssetActionEnum {
  Created = 'Created',
  Added = 'Added',
  Received = 'Received',
  StartedAuction = 'StartedAuction',
  EndedAuction = 'EndedAuction',
  ClosedAuction = 'ClosedAuction',
  Bought = 'Bought',
  Bid = 'Bid',
  PriceUpdated = 'PriceUpdated',
  Updated = 'Updated',
}

registerEnumType(AssetActionEnum, {
  name: 'AssetActionEnum',
});

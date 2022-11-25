import { registerEnumType } from '@nestjs/graphql';

export enum AssetActionEnum {
  Created = 'Created',
  Added = 'Added',
  Received = 'Received',
  StartedAuction = 'StartedAuction',
  EndedAuction = 'EndedAuction',
  ClosedAuction = 'ClosedAuction',
  Bought = 'Bought',
  AcceptedOffer = 'AcceptedOffer',
}

registerEnumType(AssetActionEnum, {
  name: 'AssetActionEnum',
});

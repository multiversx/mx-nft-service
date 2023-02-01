import { registerEnumType } from '@nestjs/graphql';

export enum AssetOfferEnum {
  Created = 'OfferCreated',
  Accepted = 'OfferAccepted',
  Closed = 'OfferClosed',
  AuctionClosedAndOfferAccepted = 'AuctionClosedAndOfferAccepted',
}

registerEnumType(AssetOfferEnum, {
  name: 'AssetOfferEnum',
});

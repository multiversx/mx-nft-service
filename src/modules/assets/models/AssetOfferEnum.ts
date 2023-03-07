import { registerEnumType } from '@nestjs/graphql';

export enum AssetOfferEnum {
  Created = 'OfferCreated',
  Accepted = 'OfferAccepted',
  Closed = 'OfferClosed',
  GloballyAccepted = 'GloballyAccepted',
}

registerEnumType(AssetOfferEnum, {
  name: 'AssetOfferEnum',
});

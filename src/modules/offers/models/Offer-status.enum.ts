import { registerEnumType } from '@nestjs/graphql';

export enum OfferStatusEnum {
  Active = 'Active',
  Closed = 'Closed',
  Bought = 'Bought',
}

registerEnumType(OfferStatusEnum, {
  name: 'OfferStatusEnum',
});

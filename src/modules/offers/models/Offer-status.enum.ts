import { registerEnumType } from '@nestjs/graphql';

export enum OfferStatusEnum {
  Active = 'Active',
  Closed = 'Closed',
  Accepted = 'Accepted',
  Expired = 'Expired',
}

registerEnumType(OfferStatusEnum, {
  name: 'OfferStatusEnum',
});

import { registerEnumType } from '@nestjs/graphql';

export enum OfferStatusEnum {
  Active = 'Active',
  Closed = 'Closed',
  Accepted = 'Accepted',
}

registerEnumType(OfferStatusEnum, {
  name: 'OfferStatusEnum',
});

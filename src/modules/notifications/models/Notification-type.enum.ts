import { registerEnumType } from '@nestjs/graphql';

export enum NotificationTypeEnum {
  Outbidded = 'Outbidded',
  Won = 'Won',
  Bought = 'Bought',
  Sold = 'Sold',
  Ended = 'Ended',
  OfferReceived = 'OfferReceived',
  OfferExpired = 'OfferExpired',
}

registerEnumType(NotificationTypeEnum, {
  name: 'NotificationTypeEnum',
});

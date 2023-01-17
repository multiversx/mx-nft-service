import { registerEnumType } from '@nestjs/graphql';

export enum NotificationTypeEnum {
  Outbidded = 'Outbidded',
  Won = 'Won',
  Bought = 'Bought',
  Sold = 'Sold',
  Ended = 'Ended',
}

registerEnumType(NotificationTypeEnum, {
  name: 'NotificationTypeEnum',
});

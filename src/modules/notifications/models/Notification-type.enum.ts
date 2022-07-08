import { registerEnumType } from '@nestjs/graphql';

export enum NotificationTypeEnum {
  Outbidded = 'Outbid',
  Won = 'Won',
  Ended = 'Ended',
}

registerEnumType(NotificationTypeEnum, {
  name: 'NotificationTypeEnum',
});

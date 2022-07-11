import { registerEnumType } from '@nestjs/graphql';

export enum NotificationTypeEnum {
  Outbidded = 'Outbidded',
  Won = 'Won',
  Ended = 'Ended',
}

registerEnumType(NotificationTypeEnum, {
  name: 'NotificationTypeEnum',
});

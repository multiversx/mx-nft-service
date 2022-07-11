import { registerEnumType } from '@nestjs/graphql';

export enum NotificationStatusEnum {
  Active = 'Active',
  Inactive = 'Inactive',
}

registerEnumType(NotificationStatusEnum, {
  name: 'NotificationStatusEnum',
});

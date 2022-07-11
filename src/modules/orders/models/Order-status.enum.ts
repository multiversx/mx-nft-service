import { registerEnumType } from '@nestjs/graphql';

export enum OrderStatusEnum {
  Active = 'Active',
  Inactive = 'Inactive',
  Bought = 'Bought',
}

registerEnumType(OrderStatusEnum, {
  name: 'OrderStatusEnum',
});

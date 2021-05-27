import { registerEnumType } from '@nestjs/graphql';

export enum OrderStatusEnum {
  active = 'active',
  inactive = 'inactive',
}

registerEnumType(OrderStatusEnum, {
  name: 'OrderStatusEnum',
});

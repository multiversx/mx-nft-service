import { registerEnumType } from '@nestjs/graphql';

export enum MarketplaceTypeEnum {
  Internal = 'Internal',
  External = 'External',
}
registerEnumType(MarketplaceTypeEnum, {
  name: 'MarketplaceTypeEnum',
});

export enum MarketplaceState {
  Enable = 'Enable',
  Disable = 'Disable',
}
registerEnumType(MarketplaceState, {
  name: 'MarketplaceState',
});

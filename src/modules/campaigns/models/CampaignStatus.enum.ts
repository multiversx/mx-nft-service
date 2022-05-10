import { registerEnumType } from '@nestjs/graphql';

export enum CampaignStatusEnum {
  Running = 'Running',
  NotStarted = 'NotStarted',
  Ended = 'Ended',
}
registerEnumType(CampaignStatusEnum, {
  name: 'CampaignStatusEnum',
});

export enum TierStatusEnum {
  Running = 'Running',
  Sold = 'Sold',
}
registerEnumType(TierStatusEnum, {
  name: 'TierStatusEnum',
});

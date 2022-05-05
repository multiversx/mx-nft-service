import { registerEnumType } from '@nestjs/graphql';

export enum CampaignStatusEnum {
  Running = 'Running',
  NotStarted = 'NotStarted',
  Ended = 'Ended',
}
registerEnumType(CampaignStatusEnum, {
  name: 'CampaignStatusEnum',
});

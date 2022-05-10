import { Resolver, Query, Args, ResolveField, Parent } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { Campaign, CampaignsResponse } from './models';
import ConnectionArgs from '../common/filters/ConnectionArgs';
import PageResponse from '../common/PageResponse';
import { CampaignStatusEnum } from './models/CampaignStatus.enum';
import { DateUtils } from 'src/utils/date-utils';
import { CampaignsService } from './campaigns.service';

@Resolver(() => Campaign)
export class CampaignsQueriesResolver extends BaseResolver(Campaign) {
  constructor(private campaignsService: CampaignsService) {
    super();
  }

  @Query(() => CampaignsResponse)
  async campaigns(
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ) {
    const { limit, offset } = pagination.pagingParams();
    const campaigns = await this.campaignsService.getCampaigns();
    return PageResponse.mapResponse<Campaign>(
      campaigns,
      pagination,
      campaigns.length,
      offset,
      limit,
    );
  }

  @ResolveField('status', () => CampaignStatusEnum)
  async status(@Parent() campaign: Campaign) {
    const { startDate, endDate, availableNfts } = campaign;
    if (startDate > DateUtils.getCurrentTimestamp()) {
      return CampaignStatusEnum.NotStarted;
    }
    if (endDate <= DateUtils.getCurrentTimestamp() || availableNfts <= 0)
      return CampaignStatusEnum.Ended;
    return CampaignStatusEnum.Running;
  }

  @ResolveField('coverImage', () => String)
  async coverImage(@Parent() campaign: Campaign) {
    const { collection } = campaign;

    return `${process.env.PINATA_GATEWAY}/ipfs/${collection.collectionHash}/1.png`;
  }
}

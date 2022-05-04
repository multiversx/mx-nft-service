import { Resolver, Query, Args } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { Campaign, CampaignsResponse } from './models';
import { NftMinterAbiService } from './nft-minter.abi.service';
import ConnectionArgs from '../common/filters/ConnectionArgs';
import PageResponse from '../common/PageResponse';
import { MintPrice } from './models/MintPrice.dto';
import { Tier } from './models/Tier.dto';
import { TierDetail } from './models/TierDetails.dto';

@Resolver(() => Campaign)
export class CampaignsQueriesResolver extends BaseResolver(Campaign) {
  constructor(private nftMinterService: NftMinterAbiService) {
    super();
  }

  @Query(() => CampaignsResponse)
  async campaigns(
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ) {
    const { limit, offset } = pagination.pagingParams();
    const campaigns = await this.nftMinterService.getCampaigns();
    return PageResponse.mapResponse<Campaign>(
      campaigns,
      pagination,
      campaigns.length,
      offset,
      limit,
    );
  }
}

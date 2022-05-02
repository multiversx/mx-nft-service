import { Resolver, Query, Args } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { Campaign, CampaignsResponse } from './models';
import { NftMinterAbiService } from './nft-minter.abi.service';
import ConnectionArgs from '../common/filters/ConnectionArgs';
import PageResponse from '../common/PageResponse';
import { MintPrice } from './models/MintPrice.dto';

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

    return PageResponse.mapResponse<Campaign>(
      [
        new Campaign({
          minterAddress:
            'erd1qqqqqqqqqqqqqpgq4twhvyxe46vx0uwkf8p94kuftyy4ryyvu00sshevvh',
          availableNfts: 50,
          totalNfts: 50,
          campaignId: 'MockCampaign',
          collectionName: 'MINTERTEST',
          collectionTicker: 'MINTER',
          collectionHash: 'hash',
          mintPrice: new MintPrice({
            token: 'EGLD',
            amount: '10000000000000000',
            startTimestamp: 1650370782,
          }),
        }),
        new Campaign({
          minterAddress:
            'erd1qqqqqqqqqqqqqpgq4twhvyxe46vx0uwkf8p94kuftyy4ryyvu00sshevvh',
          availableNfts: 50,
          totalNfts: 50,
          campaignId: 'MockCampaign2',
          collectionName: 'MINTERTEST2',
          collectionTicker: 'MINTER2',
          collectionHash: 'hash',
          mintPrice: new MintPrice({
            token: 'EGLD',
            amount: '10000000000000000',
            startTimestamp: 1650370782,
          }),
        }),

        new Campaign({
          minterAddress:
            'erd1qqqqqqqqqqqqqpgqkyagn807xeh0zwytvhd3fugvq0kz4vq3u00sgt7yfp',
          availableNfts: 50,
          totalNfts: 50,
          campaignId: 'MockCampaign2',
          collectionName: 'MINTERTEST2',
          collectionTicker: 'MINTER2',
          collectionHash: 'hash',
          mintPrice: new MintPrice({
            token: 'EGLD',
            amount: '10000000000000000',
            startTimestamp: 1650370782,
          }),
        }),
      ],
      pagination,
      3,
      offset,
      limit,
    );
  }
}

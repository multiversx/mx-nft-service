import { Resolver, Query, Args } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { PresaleCollection, PresaleCollectionsResponse } from './models';
import { NftMinterAbiService } from './nft-minter.abi.service';
import ConnectionArgs from '../common/filters/ConnectionArgs';
import PageResponse from '../common/PageResponse';
import { MintPrice } from './models/MintPrice.dto';

@Resolver(() => PresaleCollection)
export class PresaleCollectionsQueriesResolver extends BaseResolver(
  PresaleCollection,
) {
  constructor(private nftMinterService: NftMinterAbiService) {
    super();
  }

  @Query(() => PresaleCollectionsResponse)
  async presaleCollections(
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ) {
    const { limit, offset } = pagination.pagingParams();

    return PageResponse.mapResponse<PresaleCollection>(
      [
        new PresaleCollection({
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
        new PresaleCollection({
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

        new PresaleCollection({
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

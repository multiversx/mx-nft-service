import { Resolver, ResolveField, Parent, Args } from '@nestjs/graphql';
import { BaseResolver } from '../base.resolver';
import { Asset } from './models';
import { AuctionsForAssetProvider } from '../auctions';
import { Auction, AuctionResponse } from '../auctions/models';
import ConnectionArgs from '../ConnectionArgs';
import PageResponse from '../PageResponse';
import { AuctionEntity } from 'src/db/auctions';

@Resolver(() => Asset)
export class AssetAuctionResolver extends BaseResolver(Asset) {
  constructor(private auctionsProvider: AuctionsForAssetProvider) {
    super();
  }

  @ResolveField(() => AuctionResponse)
  async auctions(
    @Parent() asset: Asset,
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ) {
    if (process.env.NODE_ENV === 'production') {
      return [];
    }
    const { limit, offset } = pagination.pagingParams();
    const { identifier } = asset;
    if (!identifier) {
      return null;
    }
    const auctions = await this.auctionsProvider.load(
      `${identifier}_${offset}_${limit}`,
    );
    return PageResponse.mapResponse<Auction>(
      auctions
        ? auctions?.map((auction: AuctionEntity) => Auction.fromEntity(auction))
        : [],
      pagination,
      auctions ? auctions[0].totalCount : 0,
      offset,
      limit,
    );
  }
}

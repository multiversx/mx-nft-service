import { Resolver, ResolveField, Parent, Args } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { Asset } from './models';
import { Auction, AuctionResponse } from '../auctions/models';
import { AuctionEntity } from 'src/db/auctions';
import { AuctionsForAssetProvider } from '../auctions/loaders/asset-auctions.loader';
import ConnectionArgs from '../common/filters/ConnectionArgs';
import PageResponse from '../common/PageResponse';

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
      auctions && auctions.length > 0 ? auctions[0].totalCount : 0,
      offset,
      limit,
    );
  }
}

import { Resolver, ResolveField, Parent, Args } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { Asset } from './models';
import { Auction, AuctionResponse } from '../auctions/models';
import { AuctionEntity } from 'src/db/auctions';
import { AuctionsForAssetProvider } from '../auctions/loaders/asset-auctions.loader';
import ConnectionArgs, { getPagingParameters } from '../common/filters/ConnectionArgs';
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
    const { limit, offset } = getPagingParameters(pagination);
    const { identifier } = asset;
    if (!identifier) {
      return null;
    }
    const auctions = await this.auctionsProvider.load(`${identifier}_${offset}_${limit}`);
    const auctionsValue = auctions?.value;
    return PageResponse.mapResponse<Auction>(
      auctionsValue ? auctionsValue?.map((auction: AuctionEntity) => Auction.fromEntity(auction)) : [],
      pagination,
      auctionsValue && auctionsValue.length > 0 ? auctionsValue[0].totalCount : 0,
      offset,
      limit,
    );
  }
}

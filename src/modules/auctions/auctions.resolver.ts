import {
  Resolver,
  Query,
  Args,
  ResolveField,
  Parent,
  Mutation,
  Int,
} from '@nestjs/graphql';
import { AuctionsService } from './auctions.service';
import { BaseResolver } from '../base.resolver';
import { Account } from '../accounts/models';
import {
  Auction,
  CreateAuctionArgs,
  BidActionArgs,
  BuySftActionArgs,
  AuctionTypeEnum,
  AuctionResponse,
} from './models';
import { NftMarketplaceAbiService } from './nft-marketplace.abi.service';
import { TransactionNode } from '../transaction';
import { Order } from '../orders/models/Order.dto';
import { Asset, Price } from '../assets/models';
import ConnectionArgs from '../ConnectionArgs';
import { FiltersExpression, Grouping, Sorting } from '../filtersTypes';
import { QueryRequest, TrendingQueryRequest } from '../QueryRequest';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql.auth-guard';
import { User } from '../user';
import { AccountsProvider } from '../accounts/accounts.loader';
import {
  OrdersProvider,
  ActiveOrdersProvider,
  OrderEntity,
} from 'src/db/orders';
import { AssetsProvider } from '../assets/assets.loader';
import PageResponse from '../PageResponse';

@Resolver(() => Auction)
export class AuctionsResolver extends BaseResolver(Auction) {
  constructor(
    private auctionsService: AuctionsService,
    private nftAbiService: NftMarketplaceAbiService,
    private accountsProvider: AccountsProvider,
    private assetsProvider: AssetsProvider,
    private activeOrdersProvider: ActiveOrdersProvider,
    private ordersProvider: OrdersProvider,
  ) {
    super();
  }

  @Mutation(() => TransactionNode)
  // @UseGuards(GqlAuthGuard)
  async createAuction(
    @Args('input') input: CreateAuctionArgs,
    // @User() user: any,
  ): Promise<TransactionNode> {
    return await this.nftAbiService.createAuction(
      'erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th',
      input,
    );
  }

  @Mutation(() => TransactionNode)
  // @UseGuards(GqlAuthGuard)
  async endAuction(
    @Args({ name: 'auctionId', type: () => Int }) auctionId: number,
    // @User() user: any,
  ): Promise<TransactionNode> {
    return await this.nftAbiService.endAuction(
      'erd1uv40ahysflse896x4ktnh6ecx43u7cmy9wnxnvcyp7deg299a4sq6vaywa',
      auctionId,
    );
  }

  @Mutation(() => TransactionNode)
  // @UseGuards(GqlAuthGuard)
  async bid(
    @Args('input') input: BidActionArgs,
    // @User() user: any,
  ): Promise<TransactionNode> {
    return await this.nftAbiService.bid(
      'erd1k2s324ww2g0yj38qn2ch2jwctdy8mnfxep94q9arncc6xecg3xaq6mjse8',
      input,
    );
  }

  @Mutation(() => TransactionNode)
  // @UseGuards(GqlAuthGuard)
  async buySft(
    @Args('input') input: BuySftActionArgs,
    // @User() user: any,
  ): Promise<TransactionNode> {
    return await this.nftAbiService.buySft(
      'erd1k2s324ww2g0yj38qn2ch2jwctdy8mnfxep94q9arncc6xecg3xaq6mjse8',
      input,
    );
  }

  @Mutation(() => TransactionNode)
  // @UseGuards(GqlAuthGuard)
  async withdraw(
    @Args({ name: 'auctionId', type: () => Int }) auctionId: number,
    // @User() user: any,
  ): Promise<TransactionNode> {
    return await this.nftAbiService.withdraw(
      'erd1k2s324ww2g0yj38qn2ch2jwctdy8mnfxep94q9arncc6xecg3xaq6mjse8',
      auctionId,
    );
  }

  @Query(() => AuctionResponse)
  async auctions(
    @Args({ name: 'filters', type: () => FiltersExpression, nullable: true })
    filters,
    @Args({ name: 'sorting', type: () => [Sorting], nullable: true })
    sorting,
    @Args({ name: 'grouping', type: () => Grouping, nullable: true })
    groupBy,
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ) {
    const { limit, offset } = pagination.pagingParams();
    const [auctions, count] = await this.auctionsService.getAuctions(
      new QueryRequest({
        limit,
        offset,
        filters,
        sorting,
        groupByOption: groupBy,
      }),
    );
    return PageResponse.mapResponse<Auction>(
      auctions,
      pagination,
      count,
      offset,
      limit,
    );
  }

  @Query(() => AuctionResponse)
  async auctionsSortByBids(
    @Args({ name: 'filters', type: () => FiltersExpression, nullable: true })
    filters,
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ) {
    const { limit, offset } = pagination.pagingParams();
    const [auctions, count] =
      await this.auctionsService.getAuctionsOrderByNoBids(
        new QueryRequest({ limit, offset, filters }),
      );

    return PageResponse.mapResponse<Auction>(
      auctions,
      pagination,
      count,
      offset,
      limit,
    );
  }

  @Query(() => AuctionResponse)
  async trendingAuctions(
    @Args({
      name: 'startDate',
      description: 'This should be a timestamp',
      type: () => Int,
    })
    startDate,
    @Args({
      name: 'endDate',
      description: 'This should be a timestamp',
      type: () => Int,
    })
    endDate,

    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ) {
    const { limit, offset } = pagination.pagingParams();
    const [auctions, count] = await this.auctionsService.getTrendingAuctions(
      new TrendingQueryRequest({ limit, offset, startDate, endDate }),
    );
    return PageResponse.mapResponse<Auction>(
      auctions,
      pagination,
      count,
      offset,
      limit,
    );
  }

  @Query(() => AuctionResponse)
  // @UseGuards(GqlAuthGuard)
  async myClaimableAuctions(
    // @User() user: any,
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ) {
    const { limit, offset } = pagination.pagingParams();
    const [auctions, count] = await this.auctionsService.getClaimableAuctions(
      limit,
      offset,
      'erd1uv40ahysflse896x4ktnh6ecx43u7cmy9wnxnvcyp7deg299a4sq6vaywa',
    );
    return PageResponse.mapResponse<Auction>(
      auctions,
      pagination,
      count,
      offset,
      limit,
    );
  }

  @ResolveField('asset', () => Asset)
  async asset(@Parent() auction: Auction) {
    const { identifier } = auction;
    const nft = await this.assetsProvider.getNftByIdentifier(identifier);
    return Asset.fromNft(nft);
  }

  @ResolveField('topBid', () => Price)
  async topBid(@Parent() auction: Auction) {
    const { id, type } = auction;
    if (type === AuctionTypeEnum.SftOnePerPayment) return null;
    const activeOrders = await this.activeOrdersProvider.getOrderByAuctionId(
      id,
    );

    return activeOrders?.length > 0
      ? Price.fromEntity(activeOrders[activeOrders.length - 1])
      : null;
  }

  @ResolveField('topBidder', () => Account)
  async topBidder(@Parent() auction: Auction) {
    const { id, type } = auction;
    if (type === AuctionTypeEnum.SftOnePerPayment) return null;
    const activeOrders = await this.activeOrdersProvider.getOrderByAuctionId(
      id,
    );
    return activeOrders?.length > 0
      ? Account.fromEntity(
          await this.accountsProvider.getAccountByAddress(
            activeOrders[activeOrders.length - 1].ownerAddress,
          ),
        )
      : null;
  }

  @ResolveField('availableTokens', () => Int)
  async availableTokens(@Parent() auction: Auction) {
    const { id, nrAuctionedTokens, type } = auction;
    if (type === AuctionTypeEnum.SftOnePerPayment) {
      const orders = await this.activeOrdersProvider.getOrderByAuctionId(id);
      const sum = orders?.reduce(
        (sum: number, b: OrderEntity) =>
          sum + (b.boughtTokensNo ? parseFloat(b.boughtTokensNo) : 1),
        0,
      );
      const availableTokens = nrAuctionedTokens - sum || nrAuctionedTokens;
      return availableTokens;
    }
    return nrAuctionedTokens;
  }

  @ResolveField('orders', () => [Order])
  async orders(@Parent() auction: Auction) {
    const { id } = auction;

    if (!id) return null;
    const orderEntities = await this.ordersProvider.getOrdersByAuctionId(id);
    return orderEntities?.map((element) => Order.fromEntity(element));
  }

  @ResolveField('owner', () => Account)
  async owner(@Parent() auction: Auction) {
    const { ownerAddress } = auction;

    if (!ownerAddress) return null;
    const account = await this.accountsProvider.getAccountByAddress(
      ownerAddress,
    );
    return Account.fromEntity(account);
  }
}

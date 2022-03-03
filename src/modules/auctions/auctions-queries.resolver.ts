import {
  Resolver,
  Query,
  Args,
  ResolveField,
  Parent,
  Int,
} from '@nestjs/graphql';
import { AuctionsService } from './auctions.service';
import { BaseResolver } from '../common/base.resolver';
import { Auction, AuctionTypeEnum, AuctionResponse } from './models';
import { NftMarketplaceAbiService } from './nft-marketplace.abi.service';
import { Asset, Price } from '../assets/models';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql.auth-guard';
import { AccountsProvider } from '../account-stats/loaders/accounts.loader';
import { AssetsProvider } from '../assets/loaders/assets.loader';
import { Selections } from '@jenyus-org/nestjs-graphql-utils';
import { Account } from '../account-stats/models';
import ConnectionArgs from '../common/filters/ConnectionArgs';
import {
  FiltersExpression,
  Sorting,
  Grouping,
} from '../common/filters/filtersTypes';
import PageResponse from '../common/PageResponse';
import {
  QueryRequest,
  TrendingQueryRequest,
} from '../common/filters/QueryRequest';
import { TransactionNode } from '../common/transaction';
import { User } from '../auth/user';
import { AvailableTokensForAuctionProvider } from './loaders/available-tokens-auction.loader';
import { LastOrdersProvider } from '../orders/loaders/last-order.loader';

@Resolver(() => Auction)
export class AuctionsQueriesResolver extends BaseResolver(Auction) {
  constructor(
    private auctionsService: AuctionsService,
    private nftAbiService: NftMarketplaceAbiService,
    private accountsProvider: AccountsProvider,
    private assetsProvider: AssetsProvider,
    private lastOrderProvider: LastOrdersProvider,
    private availableTokensProvider: AvailableTokensForAuctionProvider,
  ) {
    super();
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
    @Args({ name: 'grouping', type: () => Grouping, nullable: true })
    groupBy,
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ) {
    const { limit, offset } = pagination.pagingParams();
    const [auctions, count] =
      await this.auctionsService.getAuctionsOrderByNoBids(
        new QueryRequest({ limit, offset, filters, groupByOption: groupBy }),
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

  @Query(() => String)
  async marketplaceCutPercentage() {
    return await this.nftAbiService.getCutPercentage();
  }

  @Query(() => AuctionResponse)
  @UseGuards(GqlAuthGuard)
  async myClaimableAuctions(
    @User() user: any,
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ) {
    const { limit, offset } = pagination.pagingParams();
    const [auctions, count] = await this.auctionsService.getClaimableAuctions(
      limit,
      offset,
      user.publicKey,
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
  async asset(
    @Parent() auction: Auction,
    @Selections('asset', ['*.']) fields: string[],
  ) {
    const { identifier } = auction;
    if (this.hasToResolveAsset(fields)) {
      return await this.assetsProvider.load(identifier);
    }

    return new Asset({ identifier: identifier });
  }

  @ResolveField('topBid', () => Price)
  async topBid(@Parent() auction: Auction) {
    const { id, type } = auction;
    if (type === AuctionTypeEnum.SftOnePerPayment) return null;
    const activeOrders = await this.lastOrderProvider.load(id);

    return activeOrders?.length > 0
      ? Price.fromEntity(activeOrders[activeOrders.length - 1])
      : null;
  }

  @ResolveField('topBidder', () => Account)
  async topBidder(
    @Parent() auction: Auction,
    @Selections('topBidder', ['*.']) fields: string[],
  ) {
    const { id, type } = auction;
    if (type === AuctionTypeEnum.SftOnePerPayment) return null;
    const activeOrders = await this.lastOrderProvider.load(id);
    if (activeOrders?.length <= 0) return null;
    return await this.getAccount(
      fields,
      activeOrders[activeOrders.length - 1].ownerAddress,
    );
  }

  @ResolveField('availableTokens', () => Int)
  async availableTokens(@Parent() auction: Auction) {
    const { id, nrAuctionedTokens, type } = auction;
    if (type === AuctionTypeEnum.SftOnePerPayment) {
      const result = await this.availableTokensProvider.load(id);
      return result ? result[0]?.availableTokens : 0;
    }
    return nrAuctionedTokens;
  }

  @ResolveField('owner', () => Account)
  async owner(
    @Parent() auction: Auction,
    @Selections('owner', ['*.']) fields: string[],
  ) {
    const { ownerAddress } = auction;

    if (!ownerAddress) return null;
    return await this.getAccount(fields, ownerAddress);
  }

  private hasToResolveAsset(fields: string[]) {
    return (
      fields.filter(
        (x) =>
          x !== 'totalAvailableTokens' &&
          x !== 'totalRunningAuctions' &&
          x !== 'identifier' &&
          x !== 'hasAvailableAuctions',
      ).length > 0
    );
  }

  private async getAccount(fields: string[], ownerAddress: any) {
    const account = this.hasToResolveAccount(fields)
      ? Account.fromEntity(
          await this.accountsProvider.load(ownerAddress),
          ownerAddress,
        )
      : Account.fromEntity(null, ownerAddress);
    return account;
  }

  private hasToResolveAccount(fields: string[]) {
    return (
      fields.length > 1 || (fields.length === 1 && fields[0] !== 'address')
    );
  }
}

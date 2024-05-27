import { Resolver, Query, Args, ResolveField, Parent, Int } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { Auction, AuctionTypeEnum, AuctionResponse } from './models';
import { Asset, Price } from '../assets/models';
import { UseGuards } from '@nestjs/common';
import { AccountsProvider } from '../account-stats/loaders/accounts.loader';
import { AssetsProvider } from '../assets/loaders/assets.loader';
import { Account } from '../account-stats/models';
import ConnectionArgs, { getPagingParameters } from '../common/filters/ConnectionArgs';
import { FiltersExpression, Sorting, Grouping } from '../common/filters/filtersTypes';
import { AuctionCustomFilter } from '../common/filters/AuctionCustomFilters';
import PageResponse from '../common/PageResponse';
import { QueryRequest } from '../common/filters/QueryRequest';
import { UserAuthResult } from '../auth/userAuthResult';
import { AvailableTokensForAuctionProvider } from './loaders/available-tokens-auction.loader';
import { LastOrdersProvider } from '../orders/loaders/last-order.loader';
import { AuctionsGetterService } from './auctions-getter.service';
import { PriceRange } from './models/PriceRange.dto';
import { MyClaimableAuctionsFilters } from './models/MyClaimable.Filter';
import { Marketplace } from '../marketplaces/models';
import { MarketplaceProvider } from '../marketplaces/loaders/marketplace.loader';
import { TokenFilter } from './models/Token.Filter';
import { mxConfig } from 'src/config';
import { XOXNO_KEY } from 'src/utils/constants';
import { CurrentPaymentTokensFilters } from './models/CurrentPaymentTokens.Filter';
import { Fields } from '../common/fields.decorator';
import { JwtOrNativeAuthGuard } from '../auth/jwt.or.native.auth-guard';
import { AuthUser } from '../auth/authUser';
import { Token } from '../usdPrice/Token.model';

@Resolver(() => Auction)
export class AuctionsQueriesResolver extends BaseResolver(Auction) {
  constructor(
    private auctionsGetterService: AuctionsGetterService,
    private accountsProvider: AccountsProvider,
    private assetsProvider: AssetsProvider,
    private lastOrderProvider: LastOrdersProvider,
    private marketplaceProvider: MarketplaceProvider,
    private availableTokensProvider: AvailableTokensForAuctionProvider,
  ) {
    super();
  }

  @Query(() => AuctionResponse)
  async auctions(
    @Args({
      name: 'filters',
      type: () => FiltersExpression,
      nullable: true,
      description: 'The values that can be used for this filters fields are the entity properties',
    })
    filters,
    @Args({
      name: 'sorting',
      type: () => [Sorting],
      nullable: true,
      description: 'The values that can be used for this sorting fields are the entity properties',
    })
    sorting,
    @Args({ name: 'grouping', type: () => Grouping, nullable: true })
    groupBy,
    @Args({
      name: 'customFilters',
      type: () => [AuctionCustomFilter],
      nullable: 'itemsAndList',
    })
    customFilters,
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ) {
    const { limit, offset } = getPagingParameters(pagination);
    const [auctions, count, priceRange] = await this.auctionsGetterService.getAuctions(
      new QueryRequest({
        limit,
        offset,
        filters,
        sorting,
        groupByOption: groupBy,
        customFilters,
      }),
    );

    return {
      ...PageResponse.mapResponse<Auction>(auctions, pagination, count, offset, limit),
      priceRange: priceRange
        ? PriceRange.fromEntity(priceRange?.minBid, priceRange?.maxBid, priceRange?.paymentToken, priceRange?.paymentDecimals)
        : null,
    };
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
    const { limit, offset } = getPagingParameters(pagination);

    const [auctions, count, priceRange] = await this.auctionsGetterService.getAuctionsOrderByNoBids(
      new QueryRequest({ limit, offset, filters, groupByOption: groupBy }),
    );
    return {
      ...PageResponse.mapResponse<Auction>(auctions, pagination, count, offset, limit),
      priceRange: priceRange ? PriceRange.fromEntity(priceRange?.minBid, priceRange?.maxBid, priceRange?.paymentToken) : null,
    };
  }

  @Query(() => PriceRange)
  async priceRange(
    @Args({
      name: 'filters',
      type: () => TokenFilter,
      nullable: true,
    })
    filters: TokenFilter,
  ) {
    const { minBid, maxBid } = await this.auctionsGetterService.getMinMaxPrice(filters?.token ?? mxConfig.egld);
    return PriceRange.fromEntity(minBid, maxBid);
  }

  @Query(() => AuctionResponse)
  @UseGuards(JwtOrNativeAuthGuard)
  async myClaimableAuctions(
    @AuthUser() user: UserAuthResult,
    @Args({
      name: 'filters',
      type: () => MyClaimableAuctionsFilters,
      nullable: true,
    })
    filters: MyClaimableAuctionsFilters,
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ) {
    const { limit, offset } = getPagingParameters(pagination);
    const [auctions, count] = await this.auctionsGetterService.getClaimableAuctions(limit, offset, user.address, filters?.marketplaceKey);
    return PageResponse.mapResponse<Auction>(auctions, pagination, count, offset, limit);
  }

  @ResolveField('asset', () => Asset)
  async asset(@Parent() auction: Auction, @Fields() fields: string[]) {
    const { identifier } = auction;
    if (this.hasToResolveAsset(fields)) {
      const asset = await this.assetsProvider.load(identifier);
      return asset?.value ?? null;
    }

    return new Asset({ identifier: identifier });
  }

  @ResolveField('topBid', () => Price)
  async topBid(@Parent() auction: Auction) {
    const { id, type } = auction;
    if (type === AuctionTypeEnum.SftOnePerPayment) return null;
    const activeOrders = await this.lastOrderProvider.load(id);
    const activeOrdersValue = activeOrders?.value;
    return activeOrdersValue?.length > 0 ? Price.fromEntity(activeOrdersValue[0]) : null;
  }

  @ResolveField('topBidder', () => Account)
  async topBidder(@Parent() auction: Auction, @Fields('topBidder', ['*.']) fields: string[]) {
    const { id, type } = auction;
    if (type === AuctionTypeEnum.SftOnePerPayment) return null;
    const activeOrders = await this.lastOrderProvider.load(id);
    const activeOrdersValue = activeOrders?.value;
    return activeOrdersValue && activeOrdersValue?.length > 0 ? await this.getAccount(fields, activeOrdersValue[0].ownerAddress) : null;
  }

  @ResolveField('availableTokens', () => Int)
  async availableTokens(@Parent() auction: Auction) {
    const { id, nrAuctionedTokens, type } = auction;
    if (type === AuctionTypeEnum.SftOnePerPayment) {
      const availableTokens = await this.availableTokensProvider.load(id);
      return availableTokens?.value ?? 0;
    }
    return nrAuctionedTokens;
  }

  @ResolveField('owner', () => Account)
  async owner(@Parent() auction: Auction, @Fields('owner', ['*.']) fields: string[]) {
    const { ownerAddress } = auction;

    if (!ownerAddress) return null;
    return await this.getAccount(fields, ownerAddress);
  }

  @ResolveField('marketplace', () => Marketplace)
  async marketplace(@Parent() auction: Auction) {
    const { marketplaceKey, identifier, id, marketplaceAuctionId } = auction;
    let asset: Asset;

    if (!marketplaceKey) return null;
    const marketplace = await this.marketplaceProvider.load(marketplaceKey);
    const marketplaceValue = marketplace?.value;
    if (marketplaceValue?.length > 0 && marketplaceValue[0].key === XOXNO_KEY) {
      const assetResponse = await this.assetsProvider.load(identifier);
      asset = assetResponse?.value;
    }

    return marketplaceValue?.length > 0
      ? Marketplace.fromEntity(marketplaceValue[0], identifier, id, marketplaceAuctionId, asset?.type)
      : null;
  }

  @Query(() => [Token])
  async currentPaymentTokens(
    @Args({
      name: 'filters',
      type: () => CurrentPaymentTokensFilters,
      nullable: true,
    })
    filters: CurrentPaymentTokensFilters,
  ): Promise<Token[]> {
    return await this.auctionsGetterService.getCurrentPaymentTokens(filters);
  }

  private hasToResolveAsset(fields: string[]) {
    return (
      fields.filter(
        (x) => x !== 'totalAvailableTokens' && x !== 'totalRunningAuctions' && x !== 'identifier' && x !== 'hasAvailableAuctions',
      ).length > 0
    );
  }

  private async getAccount(fields: string[], ownerAddress: any) {
    const account = this.hasToResolveAccount(fields)
      ? Account.fromEntity((await this.accountsProvider.load(ownerAddress)).value, ownerAddress)
      : Account.fromEntity(null, ownerAddress);
    return account;
  }

  private hasToResolveAccount(fields: string[]) {
    return fields.length > 1 || (fields.length === 1 && fields[0] !== 'address');
  }
}

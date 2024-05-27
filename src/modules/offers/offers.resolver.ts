import { Resolver, Query, Args, ResolveField, Parent, Mutation, Int } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { CreateOfferArgs, CreateOfferRequest, Offer, OffersResponse } from './models';
import { connectionFromArraySlice } from 'graphql-relay';
import { AccountsProvider } from '../account-stats/loaders/accounts.loader';
import { NftMarketplaceAbiService } from '../auctions';
import { Account } from '../account-stats/models';
import ConnectionArgs, { getPagingParameters } from '../common/filters/ConnectionArgs';
import { UseGuards } from '@nestjs/common';
import { TransactionNode } from '../common/transaction';
import { AssetsProvider } from '../assets';
import { Asset } from '../assets/models';
import { AcceptOfferArgs } from './models/AcceptOfferArgs';
import { AcceptOfferRequest } from './models/AcceptOfferRequest';
import { OffersFilters } from './models/Offers-Filters';
import { OffersService } from './offers.service';
import { AuthUser } from '../auth/authUser';
import { JwtOrNativeAuthGuard } from '../auth/jwt.or.native.auth-guard';
import { UserAuthResult } from '../auth/userAuthResult';
import { MarketplaceProvider } from '../marketplaces/loaders/marketplace.loader';
import { Marketplace } from '../marketplaces/models/Marketplace.dto';
import { XOXNO_KEY } from 'src/utils/constants';

@Resolver(() => Offer)
export class OffersResolver extends BaseResolver(Offer) {
  constructor(
    private accountsProvider: AccountsProvider,
    private assetsProvider: AssetsProvider,
    private offersService: OffersService,
    private nftAbiService: NftMarketplaceAbiService,
    private marketplaceProvider: MarketplaceProvider,
  ) {
    super();
  }

  @Query(() => OffersResponse)
  async offers(
    @Args({ name: 'filters', type: () => OffersFilters, nullable: true })
    filters: OffersFilters,
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ) {
    const { limit, offset } = getPagingParameters(pagination);
    const [offers, count] = await this.offersService.getOffers(filters, offset, limit);
    const page = connectionFromArraySlice(offers, pagination, {
      arrayLength: count,
      sliceStart: offset || 0,
    });
    return {
      edges: page.edges,
      pageInfo: page.pageInfo,
      pageData: { count, limit, offset },
    };
  }

  @ResolveField('owner', () => Account)
  async owner(@Parent() order: Offer) {
    const { ownerAddress } = order;

    if (!ownerAddress) return null;
    const account = await this.accountsProvider.load(ownerAddress);
    return Account.fromEntity(account?.value ?? null, ownerAddress);
  }

  @ResolveField('asset', () => Asset)
  async asset(@Parent() order: Offer) {
    const { identifier } = order;
    const asset = await this.assetsProvider.load(identifier);
    return asset?.value ?? null;
  }

  @ResolveField('marketplace', () => Marketplace)
  async marketplace(@Parent() offer: Offer) {
    const { marketplaceKey, identifier } = offer;
    let asset: Asset;

    if (!marketplaceKey) return null;
    const marketplace = await this.marketplaceProvider.load(marketplaceKey);
    const marketplaceValue = marketplace?.value;
    if (marketplaceValue?.length > 0 && marketplaceValue[0].key === XOXNO_KEY) {
      const assetResponse = await this.assetsProvider.load(identifier);
      asset = assetResponse?.value;
    }

    return marketplaceValue?.length > 0 ? Marketplace.fromEntity(marketplaceValue[0], identifier, null, null, asset?.type) : null;
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtOrNativeAuthGuard)
  async sendOffer(
    @Args('input', { type: () => CreateOfferArgs }) input: CreateOfferArgs,
    @AuthUser() user: UserAuthResult,
  ): Promise<TransactionNode> {
    const request = CreateOfferRequest.fromArgs(input);
    return await this.nftAbiService.createOffer(user.address, request);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtOrNativeAuthGuard)
  async withdrawOffer(
    @Args({ name: 'offerId', type: () => Int }) offerId: number,
    @AuthUser() user: UserAuthResult,
  ): Promise<TransactionNode> {
    return await this.nftAbiService.withdrawOffer(user.address, offerId);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtOrNativeAuthGuard)
  async acceptOffer(
    @Args('input', { type: () => AcceptOfferArgs }) input: AcceptOfferArgs,
    @AuthUser() user: UserAuthResult,
  ): Promise<TransactionNode> {
    const request = AcceptOfferRequest.fromArgs(input);
    return await this.nftAbiService.acceptOffer(user.address, request);
  }
}

import {
  Resolver,
  Query,
  Args,
  ResolveField,
  Parent,
  Mutation,
  Int,
} from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { Auction } from '../auctions/models';
import {
  CreateOfferArgs,
  CreateOfferRequest,
  Offer,
  OffersResponse,
} from './models';
import { connectionFromArraySlice } from 'graphql-relay';
import { AccountsProvider } from '../account-stats/loaders/accounts.loader';
import { NftMarketplaceAbiService } from '../auctions';
import { Account } from '../account-stats/models';
import ConnectionArgs from '../common/filters/ConnectionArgs';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql.auth-guard';
import { User } from '../auth/user';
import { TransactionNode } from '../common/transaction';
import { AssetsProvider } from '../assets';
import { Asset } from '../assets/models';
import { AcceptOfferArgs } from './models/AcceptOfferArgs';
import { AcceptOfferRequest } from './models/AcceptOfferRequest';
import { OffersFilters } from './models/Offers-Filters';
import { OffersService } from './offers.service';

@Resolver(() => Offer)
export class OffersResolver extends BaseResolver(Offer) {
  constructor(
    private accountsProvider: AccountsProvider,
    private assetsProvider: AssetsProvider,
    private offersService: OffersService,
    private nftAbiService: NftMarketplaceAbiService,
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
    const { limit, offset } = pagination.pagingParams();
    const [offers, count] = await this.offersService.getOffers(
      filters,
      offset,
      limit,
    );
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

  @ResolveField('from', () => Account)
  async from(@Parent() order: Offer) {
    const { ownerAddress } = order;

    if (!ownerAddress) return null;
    const account = await this.accountsProvider.load(ownerAddress);
    return Account.fromEntity(account?.value ?? null, ownerAddress);
  }

  @ResolveField('asset', () => Asset)
  async asset(@Parent() order: Offer) {
    const { identifier } = order;
    const auctions = await this.assetsProvider.load(identifier);
    return auctions?.value !== undefined
      ? Auction.fromEntity(auctions.value)
      : null;
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async sendOffer(
    @Args('input', { type: () => CreateOfferArgs }) input: CreateOfferArgs,
    @User() user: any,
  ): Promise<TransactionNode> {
    const request = CreateOfferRequest.fromArgs(input);
    return await this.nftAbiService.createOffer(user.publicKey, request);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async withdrawOffer(
    @Args({ name: 'offerId', type: () => Int }) offerId: number,
    @User() user: any,
  ): Promise<TransactionNode> {
    return await this.nftAbiService.withdrawOffer(user.publicKey, offerId);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async acceptOffer(
    @Args('input', { type: () => AcceptOfferArgs }) input: AcceptOfferArgs,
    @User() user: any,
  ): Promise<TransactionNode> {
    const request = AcceptOfferRequest.fromArgs(input);
    return await this.nftAbiService.acceptOffer(user.publicKey, request);
  }
}

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
import { FiltersExpression, Sorting } from '../common/filters/filtersTypes';
import ConnectionArgs from '../common/filters/ConnectionArgs';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql.auth-guard';
import { User } from '../auth/user';
import { TransactionNode } from '../common/transaction';
import { AssetsProvider } from '../assets';
import { Asset } from '../assets/models';

@Resolver(() => Offer)
export class OffersResolver extends BaseResolver(Offer) {
  constructor(
    private accountsProvider: AccountsProvider,
    private assetsProvider: AssetsProvider,
    private nftAbiService: NftMarketplaceAbiService,
  ) {
    super();
  }

  @Query(() => OffersResponse)
  async offers(
    @Args({ name: 'filters', type: () => FiltersExpression, nullable: true })
    filters,
    @Args({ name: 'sorting', type: () => [Sorting], nullable: true })
    sorting,
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ) {
    const { limit, offset } = pagination.pagingParams();
    const [orders, count] = [[], 0];
    const page = connectionFromArraySlice(orders, pagination, {
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
    @Args({ name: 'offerId', type: () => Int }) offerId: number,
    @User() user: any,
  ): Promise<TransactionNode> {
    return await this.nftAbiService.withdraw(user.publicKey, offerId);
  }
}

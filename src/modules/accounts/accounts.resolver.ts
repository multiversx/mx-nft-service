import { Account } from './models/account.dto';
import {
  Mutation,
  Query,
  Resolver,
  Args,
  ResolveField,
  Parent,
  Context,
} from '@nestjs/graphql';
import { AccountsService } from './accounts.service';
import { AssetsService } from '../assets/assets.service';
import { CreateAccountArgs } from './CreateAccountArgs';
import { Asset } from '../assets/models';
import { FiltersExpression } from '../filtersTypes';
import { connectionFromArraySlice } from 'graphql-relay';
import ConnectionArgs from '../ConnectionArgs';
import AccountResponse from './models/AccountResponse';
import { Auction } from '../auctions/models';
import { IGraphQLContext } from 'src/db/auctions/graphql.types';

@Resolver(() => Account)
export class AccountsResolver {
  constructor(
    private accountsService: AccountsService,
    private assetsService: AssetsService,
  ) {}

  @Mutation(() => Account)
  async createAccount(
    @Args('input') input: CreateAccountArgs,
  ): Promise<Account> {
    return this.accountsService.createAccount(input);
  }

  @Mutation(() => Account)
  async updateAccount(
    @Args('profileImgUrl') profileImgUrl: string,
  ): Promise<void> {
    return this.accountsService.updateAccount(profileImgUrl);
  }

  @Query(() => AccountResponse)
  async accounts(
    @Args({ name: 'filters', type: () => FiltersExpression, nullable: true })
    filters,
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ): Promise<AccountResponse> {
    const { limit, offset } = pagination.pagingParams();
    const [accounts, count] = await this.accountsService.getAccounts(
      limit,
      offset,
      filters,
    );
    const page = connectionFromArraySlice(accounts, pagination, {
      arrayLength: count,
      sliceStart: offset || 0,
    });
    return {
      edges: page.edges,
      pageInfo: page.pageInfo,
      pageData: { count, limit, offset },
    };
  }

  @ResolveField('assets', () => [Asset])
  async assets(@Parent() account: Account): Promise<Asset[]> {
    const [assets, count] = await this.assetsService.getAssetsForUser(
      account.address,
    );
    return assets;
  }

  @ResolveField('auctions', () => [Auction])
  async auction(
    @Parent() account: Account,
    @Context()
    { acountAuctionLoader: acountAuctionLoader }: IGraphQLContext,
  ) {
    const { address } = account;
    return acountAuctionLoader.load(address);
  }

  @ResolveField('followers', () => [Account])
  async followers(@Parent() account: Account): Promise<Account[]> {
    return await this.accountsService.getFollowers(account.id);
  }

  @ResolveField('following', () => [Account])
  async following(@Parent() account: Account): Promise<Account[]> {
    return await this.accountsService.getFollowing(account.id);
  }
}

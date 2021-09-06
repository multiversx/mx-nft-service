import { Account } from './models/Account.dto';
import { Mutation, Query, Resolver, Args } from '@nestjs/graphql';
import { AccountsService } from './accounts.service';
import { FollowEntityArgs, UnfollowEntityArgs } from './CreateAccountArgs';
import { connectionFromArraySlice } from 'graphql-relay';
import ConnectionArgs from '../ConnectionArgs';
import AccountResponse from './models/AccountResponse';
import { User } from '../user';
import { AccountsFilter } from './models/AccountsFilter';
import { ElrondIdentityService } from 'src/common';

@Resolver(() => Account)
export class AccountsResolver {
  constructor(
    private accountsService: AccountsService,
    private identityService: ElrondIdentityService,
  ) {}

  @Query(() => AccountResponse)
  async accounts(
    @Args({ name: 'filters', type: () => AccountsFilter })
    filters,
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ): Promise<AccountResponse> {
    const { limit, offset } = pagination.pagingParams();
    const accounts = await this.identityService.getProfiles(filters?.addresses);
    return this.mapResponse<Account>(
      accounts?.map((acc) => Account.fromEntity(acc)),
      pagination,
      accounts?.length,
      offset,
      limit,
    );
  }

  @Mutation(() => Boolean)
  async follow(
    @Args('input') input: FollowEntityArgs,
    @User() user: any,
  ): Promise<boolean> {
    return this.accountsService.follow(user.publicKey, input.addressToFollow);
  }

  @Mutation(() => Boolean)
  async unfollow(
    @Args('input') input: UnfollowEntityArgs,
    @User() user: any,
  ): Promise<boolean> {
    return this.accountsService.unfollow(
      user.publicKey,
      input.addressToUnfollow,
    );
  }

  @Query(() => AccountResponse)
  async followers(
    @Args({ name: 'address', type: () => String, nullable: true })
    address,
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ): Promise<AccountResponse> {
    const { limit, offset } = pagination.pagingParams();
    const [followers, count] = await this.accountsService.getFollowers(address);
    return this.mapResponse<Account>(
      followers,
      pagination,
      count,
      offset,
      limit,
    );
  }

  @Query(() => AccountResponse)
  async following(
    @Args({ name: 'address', type: () => String, nullable: true })
    address,
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ): Promise<AccountResponse> {
    const { limit, offset } = pagination.pagingParams();
    const [accounts, count] = await this.accountsService.getFollowing(address);
    return this.mapResponse<Account>(
      accounts,
      pagination,
      count,
      offset,
      limit,
    );
  }

  private mapResponse<T>(
    returnList: T[],
    args: ConnectionArgs,
    count: number,
    offset: number,
    limit: number,
  ) {
    const page = connectionFromArraySlice(returnList, args, {
      arrayLength: count,
      sliceStart: offset || 0,
    });
    return {
      edges: page.edges,
      pageInfo: page.pageInfo,
      pageData: { count, limit, offset },
    };
  }
}

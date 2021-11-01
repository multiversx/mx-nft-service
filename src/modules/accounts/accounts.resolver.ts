import {
  Account,
  AccountsFilter,
  AccountResponse,
  FollowEntityArgs,
  UnfollowEntityArgs,
} from './models';
import { UseGuards } from '@nestjs/common';
import {
  Mutation,
  Query,
  Resolver,
  Args,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { AccountsService } from './accounts.service';
import ConnectionArgs from '../ConnectionArgs';
import { User } from '../user';
import { ElrondIdentityService } from 'src/common';
import { GqlAuthGuard } from '../auth/gql.auth-guard';
import PageResponse from '../PageResponse';

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
    return PageResponse.mapResponse<Account>(
      accounts?.map((acc) => Account.fromEntity(acc)) || [],
      pagination,
      accounts?.length || 0,
      offset,
      limit,
    );
  }

  @ResolveField('followers', () => AccountResponse)
  async followers(
    @Parent() account: Account,
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ): Promise<AccountResponse> {
    const { address } = account;
    const { limit, offset } = pagination.pagingParams();
    const [followers, count] = await this.accountsService.getFollowers(
      address,
      offset,
      limit,
    );

    let accountsFollowers: any = [];
    if (followers.length > 0) {
      accountsFollowers = await this.identityService.getProfiles(
        followers.map((acc) => acc?.followerAddress),
      );
    }
    return PageResponse.mapResponse<Account>(
      accountsFollowers?.map((a) => Account.fromEntity(a)),
      pagination,
      count,
      offset,
      limit,
    );
  }

  @ResolveField('following', () => AccountResponse)
  async following(
    @Parent() account: Account,
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ): Promise<AccountResponse> {
    const { address } = account;
    const { limit, offset } = pagination.pagingParams();
    const [following, count] = await this.accountsService.getFollowing(
      address,
      offset,
      limit,
    );
    let accountsFollowing: any = [];
    if (following.length > 0) {
      accountsFollowing = await this.identityService.getProfiles(
        following.map((acc) => acc?.followingAddress),
      );
    }

    return PageResponse.mapResponse<Account>(
      accountsFollowing?.map((a) => Account.fromEntity(a)),
      pagination,
      count,
      offset,
      limit,
    );
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async follow(
    @Args('input') input: FollowEntityArgs,
    @User() user: any,
  ): Promise<boolean> {
    return this.accountsService.follow(user.publicKey, input.addressToFollow);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async unfollow(
    @Args('input') input: UnfollowEntityArgs,
    @User() user: any,
  ): Promise<boolean> {
    return this.accountsService.unfollow(
      user.publicKey,
      input.addressToUnfollow,
    );
  }
}

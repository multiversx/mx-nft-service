import { Account } from '../nfts/dto/account.dto';
import { Mutation, Query, Resolver, Args } from '@nestjs/graphql';
import { AccountsService } from './accounts.service';
import { AccountsServiceDb } from 'src/db/accounts/accounts.service';
import { FollowersServiceDb } from 'src/db/followers/followers.service';

@Resolver()
export class AccountsResolver {
  constructor(
    private accountsServiceDb: AccountsServiceDb,
    private followerServiceDb: FollowersServiceDb,
    private accountsService: AccountsService,
  ) {
  }

  @Mutation(() => Account)
  async createAccount(
    @Args('address') address: string,
    @Args('profileImgUrl') profileImgUrl: string,
    @Args('herotag') herotag: string,
  ): Promise<void> {
    return this.accountsService.createAccount(
      address,
      profileImgUrl,
      herotag,
    );
  }

  @Mutation(() => Account)
  async updateAccount(
    @Args('profileImgUrl') profileImgUrl: string,
  ): Promise<void> {
    return this.accountsService.updateAccount(
      profileImgUrl,
    );
  }

  @Query(() => Account)
  async getAccountById(
    @Args('id') id: number,
  ): Promise<Account> {
    return this.accountsService.getAccountById(id);
  }

  @Query(() => Account)
  async getAccountByAddress(
    @Args('address') address: string,
  ): Promise<Account> {
    return this.accountsService.getAccountByAddress(address);
  }

  @Query(() => Account)
  async getAccountWithFollowing(
    @Args('id') id: number,
  ): Promise<Account> {
    return await this.accountsService.getAccountWithFollowers(id);
  }
}

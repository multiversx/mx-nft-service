import { Account } from '../nfts/dto/account.dto';
import { Mutation, Query, Resolver, Args, ResolveField, Parent } from '@nestjs/graphql';
import { AccountsService } from './accounts.service';
import { add } from 'winston';

@Resolver(() => Account)
export class AccountsResolver {
  constructor(
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
  async getAccount(
    @Args('id', { nullable: true }) id?: number,
    @Args('address', { nullable: true }) address?: string
  ): Promise<Account> {
    if (id != undefined) {
      return await this.accountsService.getAccountById(id)
    }
    return await this.accountsService.getAccountByAddress(address)
  }

  @ResolveField('followers', () => [Account])
  async followers(@Parent() account: Account): Promise<Account[]> {
    return await this.accountsService.getFollowers(account.id)
  }

  @ResolveField('following', () => [Account])
  async following(@Parent() account: Account): Promise<Account[]> {
    return await this.accountsService.getFollowing(account.id)
  }
}

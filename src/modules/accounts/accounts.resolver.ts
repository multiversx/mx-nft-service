import { Account } from '../nfts/dto/account.dto';
import {
  Mutation,
  Query,
  Resolver,
  Args,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { AccountsService } from './accounts.service';
import { Asset } from '../nfts/dto/asset.dto';
import { AssetsService } from '../assets/assets.service';
import { CreateAccountArgs } from './CreateAccountArgs';

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

  @Query(() => Account)
  async getAccount(
    @Args('id', { nullable: true }) id?: number,
    @Args('address', { nullable: true }) address?: string,
  ): Promise<Account> {
    if (id != undefined) {
      return await this.accountsService.getAccountById(id);
    }
    return await this.accountsService.getAccountByAddress(address);
  }

  @ResolveField('assets', () => [Asset])
  async assets(@Parent() account: Account): Promise<Account[]> {
    return await this.assetsService.getAssetsForUser(account.address);
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

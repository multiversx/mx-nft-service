import {
  Resolver,
  Query,
  Args,
  ResolveField,
  Parent,
  Mutation,
} from '@nestjs/graphql';
import { AccountsService } from '../accounts/accounts.service';
import { BaseResolver } from '../nfts/base.resolver';
import { Account } from '../nfts/dto/account.dto';
import { Onwer } from '../nfts/dto/onwer.dto';
import { Asset } from '../nfts/dto/asset.dto';
import { Attribute } from '../nfts/dto/attributes.dto';
import CreateNftArgs, { TransferNftArgs } from '../nfts/dto/createNftArgs';
import { TransactionNode } from '../nfts/dto/transaction';
import { AssetsService } from './assets.service';
@Resolver(() => Asset)
export class AssetsResolver extends BaseResolver(Asset) {
  constructor(
    private assetsService: AssetsService,
    private accountsService: AccountsService,
  ) {
    super();
  }

  @Mutation(() => TransactionNode, { name: 'createNft' })
  async createNft(@Args() args: CreateNftArgs): Promise<TransactionNode> {
    return await this.assetsService.createNft(args);
  }

  @Mutation(() => TransactionNode, { name: 'transferNft' })
  async transferNft(@Args() args: TransferNftArgs): Promise<TransactionNode> {
    return await this.assetsService.transferNft(args);
  }

  @Query(() => [Asset])
  async getAssetsForUser(@Args('address') address: string) {
    return this.assetsService.getAssetsForUser(address);
  }

  @ResolveField('creator', () => Account)
  async creator(@Parent() asset: Asset) {
    const { creatorAddress } = asset;
    return await this.accountsService.getAccountByAddress(creatorAddress);
  }

  @ResolveField('currentOwner', () => Onwer)
  async currentOwner(@Parent() asset: Asset) {
    const { ownerAddress } = asset;
    return await this.accountsService.getOwnerByAddress(ownerAddress);
  }

  @ResolveField('previousOwners', () => [Account])
  async previousOwners(@Parent() asset: Asset) {
    const { currentOwner } = asset;
    return {};
  }

  @ResolveField('attributes', () => [Attribute])
  async attributes(@Parent() asset: Asset) {
    const { currentOwner } = asset;
    return {};
  }
}

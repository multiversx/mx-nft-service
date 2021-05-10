import {
  Resolver,
  Query,
  Args,
  ResolveField,
  Parent,
  Mutation,
} from '@nestjs/graphql';
import { BaseResolver } from '../nfts/base.resolver';
import { Account } from '../nfts/dto/account.dto';
import { Asset } from '../nfts/dto/asset.dto';
import { Attribute } from '../nfts/dto/attributes.dto';
import CreateNftArgs, { TransferNftArgs } from '../nfts/dto/createNftArgs';
import { TransactionNode } from '../nfts/dto/transaction';
import { AssetsService } from './assets.service';
@Resolver(() => Asset)
export class AssetsResolver extends BaseResolver(Asset) {
  constructor(private assetsService: AssetsService) {
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

  @Query(() => [Asset], { name: 'assets' })
  async getAssets() {
    return this.assetsService.getAssets();
  }

  @ResolveField('creator', () => Account)
  async creator(@Parent() asset: Asset) {
    const { creatorAddress } = asset;
    return this.authorsService.getAccount(creatorAddress) || {};
  }

  @ResolveField('currentOwner', () => Account)
  async currentOwner(@Parent() asset: Asset) {
    const { ownerAddress } = asset;
    return this.authorsService.getAccount(ownerAddress) || {};
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

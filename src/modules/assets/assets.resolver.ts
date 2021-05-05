import { Resolver, Query, Args, ResolveField, Parent } from '@nestjs/graphql';
import { BaseResolver } from '../nfts/base.resolver';
import { Account } from '../nfts/dto/account.dto';
import { Asset } from '../nfts/dto/asset.dto';
import { Attribute } from '../nfts/dto/attributes.dto';
import { AssetsService } from './assets.service';
@Resolver((of) => Asset)
export class AssetsResolver extends BaseResolver(Asset) {
  constructor(private assetsService: AssetsService) {
    super();
  }

  @Query((returns) => [Asset], { name: 'assets' })
  async getAssets(@Args('id', { type: () => String }) address: string) {
    return this.assetsService.getAssetsForUser(address);
  }

  @ResolveField('creator', () => Account)
  async creator(@Parent() asset: Asset) {
    const { currentOwner } = asset;
    return {};
  }

  @ResolveField('currentOwner', () => Account)
  async currentOwner(@Parent() asset: Asset) {
    const { currentOwner } = asset;
    return {};
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

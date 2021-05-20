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
import { TransactionNode } from '../nfts/dto/transaction';
import { AssetsService } from './assets.service';
import { Tag } from '../nfts/dto/tag.dto';
import { AddTagsArgs, CreateNftArgs, TransferNftArgs } from './models';
import { FileUpload } from 'graphql-upload';
import { GraphQLUpload } from 'apollo-server-express'; // notice this is not imported from graphql-upload

import { createWriteStream } from 'fs';

@Resolver(() => Asset)
export class AssetsResolver extends BaseResolver(Asset) {
  constructor(
    private assetsService: AssetsService,
    private accountsService: AccountsService,
  ) {
    super();
  }

  @Mutation(() => TransactionNode, { name: 'createNft' })
  async createNft(
    @Args('input') input: CreateNftArgs,
  ): Promise<TransactionNode> {
    return await this.assetsService.createNft(input);
  }

  @Mutation(() => TransactionNode, { name: 'transferNft' })
  async transferNft(
    @Args('input') input: TransferNftArgs,
  ): Promise<TransactionNode> {
    return await this.assetsService.transferNft(input);
  }

  @Mutation(() => [Tag], { name: 'addTags' })
  async addTags(@Args('input') input: AddTagsArgs): Promise<[Tag]> {
    return await this.assetsService.addTags(input);
  }

  @Mutation(() => String)
  async uploadImage(
    @Args({ name: 'file', type: () => GraphQLUpload }) file,
  ): Promise<String> {
    console.log(file);
    return await this.assetsService.getFileData(file);
  }

  @Mutation(() => Boolean)
  async uploadFile(
    @Args({ name: 'file', type: () => GraphQLUpload })
    { createReadStream, filename }: FileUpload,
  ): Promise<boolean> {
    console.log(filename);
    return new Promise(async (resolve, reject) =>
      createReadStream()
        .pipe(createWriteStream(`${filename}`))
        .on('finish', () => resolve(true))
        .on('error', (err) => reject(err)),
    );
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
}

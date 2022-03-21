import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { AssetsService } from '.';
import {
  Asset,
  CreateNftArgs,
  TransferNftArgs,
  HandleQuantityArgs,
  AddLikeArgs,
  RemoveLikeArgs,
} from './models';
import { GraphQLUpload } from 'apollo-server-express';
import { FileUpload } from 'graphql-upload';
import { AssetsLikesService } from './assets-likes.service';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql.auth-guard';
import { ContentValidation } from './content.validation.service';
import { TransactionNode } from '../common/transaction';
import { User } from '../auth/user';
import {
  CreateNftRequest,
  UpdateQuantityRequest,
  TransferNftRequest,
} from './models/requests';

@Resolver(() => Asset)
export class AssetsMutationsResolver extends BaseResolver(Asset) {
  constructor(
    private assetsService: AssetsService,
    private assetsLikesService: AssetsLikesService,
    private contentValidation: ContentValidation,
  ) {
    super();
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async createNft(
    @Args('input') input: CreateNftArgs,
    @Args({ name: 'file', type: () => GraphQLUpload }) file: FileUpload,
    @User() user: any,
  ): Promise<TransactionNode> {
    const request = CreateNftRequest.fromArgs(input, file);
    return await this.assetsService.createNft(user.publicKey, request);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async verifyContent(
    @Args({ name: 'file', type: () => GraphQLUpload }) file: FileUpload,
  ): Promise<Boolean> {
    const fileData = await file;

    const contentStatus = (
      await this.contentValidation
        .checkContentType(fileData)
        .checkContentSensitivity(fileData)
    ).getStatus();
    if (contentStatus) {
      return true;
    }
    throw Error('Invalid content');
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async addSftQuantity(
    @Args('input') input: HandleQuantityArgs,
    @User() user: any,
  ): Promise<TransactionNode> {
    const request = UpdateQuantityRequest.fromArgs(input, 'ESDTNFTAddQuantity');
    return await this.assetsService.updateQuantity(user.publicKey, request);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async burnQuantity(
    @Args('input') input: HandleQuantityArgs,
    @User() user: any,
  ): Promise<TransactionNode> {
    const request = UpdateQuantityRequest.fromArgs(input, 'ESDTNFTBurn');
    return await this.assetsService.updateQuantity(user.publicKey, request);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async transferNft(
    @Args('input') input: TransferNftArgs,
    @User() user: any,
  ): Promise<TransactionNode> {
    const request = TransferNftRequest.fromArgs(input);
    return await this.assetsService.transferNft(user.publicKey, request);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  addLike(
    @Args('input') input: AddLikeArgs,
    @User() user: any,
  ): Promise<boolean> {
    return this.assetsLikesService.addLike(input.identifier, user.publicKey);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  removeLike(
    @Args('input') input: RemoveLikeArgs,
    @User() user: any,
  ): Promise<boolean> {
    return this.assetsLikesService.removeLike(input.identifier, user.publicKey);
  }
}

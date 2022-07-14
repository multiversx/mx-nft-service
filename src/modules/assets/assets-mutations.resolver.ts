import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { AssetsTransactionService } from '.';
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
import { AuthorizationHeader } from '../auth/authorization-header';

@Resolver(() => Asset)
export class AssetsMutationsResolver extends BaseResolver(Asset) {
  constructor(
    private assetsTransactionService: AssetsTransactionService,
    private assetsLikesService: AssetsLikesService,
    private contentValidation: ContentValidation,
  ) {
    super();
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async createNft(
    @Args('input', { type: () => CreateNftArgs }) input: CreateNftArgs,
    @Args({ name: 'file', type: () => GraphQLUpload }) file: FileUpload,
    @User() user: any,
  ): Promise<TransactionNode> {
    const request = CreateNftRequest.fromArgs(input, file);
    return await this.assetsTransactionService.createNft(
      user.publicKey,
      request,
    );
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
    @Args('input', { type: () => HandleQuantityArgs })
    input: HandleQuantityArgs,
    @User() user: any,
  ): Promise<TransactionNode> {
    const request = UpdateQuantityRequest.fromArgs(input, 'ESDTNFTAddQuantity');
    return await this.assetsTransactionService.updateQuantity(
      user.publicKey,
      request,
    );
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async burnQuantity(
    @Args('input', { type: () => HandleQuantityArgs })
    input: HandleQuantityArgs,
    @User() user: any,
  ): Promise<TransactionNode> {
    const request = UpdateQuantityRequest.fromArgs(input, 'ESDTNFTBurn');
    return await this.assetsTransactionService.updateQuantity(
      user.publicKey,
      request,
    );
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async transferNft(
    @Args('input', { type: () => TransferNftArgs }) input: TransferNftArgs,
    @User() user: any,
  ): Promise<TransactionNode> {
    const request = TransferNftRequest.fromArgs(input);
    return await this.assetsTransactionService.transferNft(
      user.publicKey,
      request,
    );
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  addLike(
    @Args('input', { type: () => AddLikeArgs }) input: AddLikeArgs,
    @User() user: any,
    @AuthorizationHeader() authorizationHeader: string,
  ): Promise<boolean> {
    return this.assetsLikesService.addLike(
      input.identifier,
      user.publicKey,
      authorizationHeader,
    );
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  removeLike(
    @Args('input', { type: () => RemoveLikeArgs }) input: RemoveLikeArgs,
    @User() user: any,
    @AuthorizationHeader() authorizationHeader: string,
  ): Promise<boolean> {
    return this.assetsLikesService.removeLike(
      input.identifier,
      user.publicKey,
      authorizationHeader,
    );
  }
}

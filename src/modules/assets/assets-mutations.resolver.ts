import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { FileUpload, GraphQLUpload } from 'graphql-upload-ts';
import { AssetsTransactionService } from '.';
import { AuthorizationHeader } from '../auth/authorization-header';
import { AuthUser } from '../auth/authUser';
import { JwtOrNativeAuthGuard } from '../auth/jwt.or.native.auth-guard';
import { UserAuthResult } from '../auth/userAuthResult';
import { BaseResolver } from '../common/base.resolver';
import { TransactionNode } from '../common/transaction';
import { AssetsLikesService } from './assets-likes.service';
import { ContentValidation } from './content.validation.service';
import { AddLikeArgs, Asset, CreateNftArgs, HandleQuantityArgs, RemoveLikeArgs, TransferNftArgs } from './models';
import { CreateNftRequest, CreateNftWithMultipleFilesRequest, TransferNftRequest, UpdateQuantityRequest } from './models/requests';

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
  @UseGuards(JwtOrNativeAuthGuard)
  async createNft(
    @Args('input', { type: () => CreateNftArgs }) input: CreateNftArgs,
    @Args({ name: 'file', type: () => GraphQLUpload }) file: FileUpload,
    @AuthUser() user: UserAuthResult,
  ): Promise<TransactionNode> {
    const request = CreateNftRequest.fromArgs(input, file);
    return await this.assetsTransactionService.createNft(user.address, request);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtOrNativeAuthGuard)
  async createNftWithMultipleFiles(
    @Args('input', { type: () => CreateNftArgs }) input: CreateNftArgs,
    @Args({ name: 'files', type: () => [GraphQLUpload] }) files: [FileUpload],
    @AuthUser() user: UserAuthResult,
  ): Promise<TransactionNode> {
    const request = CreateNftWithMultipleFilesRequest.fromArgs(input, files);
    return await this.assetsTransactionService.createNftWithMultipleFiles(user.address, request);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard)
  async verifyContent(@Args({ name: 'file', type: () => GraphQLUpload }) file: FileUpload): Promise<Boolean> {
    const fileData = await file;

    const contentStatus = (await this.contentValidation.checkContentType(fileData).checkContentSensitivity(fileData)).getStatus();
    if (contentStatus) {
      return true;
    }
    throw Error('Invalid content');
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtOrNativeAuthGuard)
  async addSftQuantity(
    @Args('input', { type: () => HandleQuantityArgs })
    input: HandleQuantityArgs,
    @AuthUser() user: UserAuthResult,
  ): Promise<TransactionNode> {
    const request = UpdateQuantityRequest.fromArgs(input, 'ESDTNFTAddQuantity');
    return await this.assetsTransactionService.updateQuantity(user.address, request);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtOrNativeAuthGuard)
  async burnQuantity(
    @Args('input', { type: () => HandleQuantityArgs })
    input: HandleQuantityArgs,
    @AuthUser() user: UserAuthResult,
  ): Promise<TransactionNode> {
    const request = UpdateQuantityRequest.fromArgs(input, 'ESDTNFTBurn');
    return await this.assetsTransactionService.burnQuantity(user.address, request);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtOrNativeAuthGuard)
  async transferNft(
    @Args('input', { type: () => TransferNftArgs }) input: TransferNftArgs,
    @AuthUser() user: UserAuthResult,
  ): Promise<TransactionNode> {
    const request = TransferNftRequest.fromArgs(input);
    return await this.assetsTransactionService.transferNft(user.address, request);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard)
  addLike(
    @Args('input', { type: () => AddLikeArgs }) input: AddLikeArgs,
    @AuthUser() user: UserAuthResult,
    @AuthorizationHeader() authorizationHeader: string,
  ): Promise<boolean> {
    return this.assetsLikesService.addLike(input.identifier, user.address, authorizationHeader);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard)
  removeLike(
    @Args('input', { type: () => RemoveLikeArgs }) input: RemoveLikeArgs,
    @AuthUser() user: UserAuthResult,
    @AuthorizationHeader() authorizationHeader: string,
  ): Promise<boolean> {
    return this.assetsLikesService.removeLike(input.identifier, user.address, authorizationHeader);
  }
}

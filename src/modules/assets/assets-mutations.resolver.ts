import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { AssetsTransactionService } from '.';
import { Asset, CreateNftArgs, TransferNftArgs, HandleQuantityArgs, AddLikeArgs, RemoveLikeArgs } from './models';
import { GraphQLUpload, FileUpload } from 'graphql-upload';
import { AssetsLikesService } from './assets-likes.service';
import { UseGuards } from '@nestjs/common';
import { ContentValidation } from './content.validation.service';
import { TransactionNode } from '../common/transaction';
import {
  CreateNftRequest,
  UpdateQuantityRequest,
  TransferNftRequest,
  CreateNftWithMultipleFilesRequest,
} from './models/requests';
import { AuthorizationHeader } from '../auth/authorization-header';
import { JwtOrNativeAuthGuard } from '../auth/jwt.or.native.auth-guard';
import { AuthUser } from '../auth/authUser';
import { UserAuthResult } from '../auth/userAuthResult';

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
  // @UseGuards(GqlAuthGuard)
  async createNft(
    @Args('input') input: CreateNftArgs,
    // @Args({ name: 'file', type: () => GraphQLUpload }) file: FileUpload,
    // @User() user: any,
  ): Promise<TransactionNode> {
    // const fileData = await file;
    // if (
    //   !Object.values(MediaMimeTypeEnum).includes(
    //     fileData.mimetype as MediaMimeTypeEnum,
    //   )
    // )
    //   throw new Error('unsuported_media_type');
    // input.file = fileData;
    return await this.assetsTransactionService.createNft(
      'erd178ah2z70a442g9hrt39w2ld67lav62jq72gzp3r9tu5egz4hr4cswr5unp',
      CreateNftRequest.fromArgs(input),
    );
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

    const contentStatus = (
      await this.contentValidation.checkContentType(fileData).checkContentSensitivity(fileData)
    ).getStatus();
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

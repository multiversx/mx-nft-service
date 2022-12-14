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
import { GraphQLUpload, FileUpload } from 'graphql-upload';
import { AssetsLikesService } from './assets-likes.service';
import { UseGuards } from '@nestjs/common';
import { ContentValidation } from './content.validation.service';
import { TransactionNode } from '../common/transaction';
import {
  CreateNftRequest,
  UpdateQuantityRequest,
  TransferNftRequest,
} from './models/requests';
import { AuthorizationHeader } from '../auth/authorization-header';
import { JwtOrNativeAuthGuard } from '../auth/jwt.or.native.auth-guard';
import { AuthUser } from '../auth/nativeAuth';
import { UserAuthResult } from '../auth/user';

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

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard)
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
  @UseGuards(JwtOrNativeAuthGuard)
  async addSftQuantity(
    @Args('input', { type: () => HandleQuantityArgs })
    input: HandleQuantityArgs,
    @AuthUser() user: UserAuthResult,
  ): Promise<TransactionNode> {
    const request = UpdateQuantityRequest.fromArgs(input, 'ESDTNFTAddQuantity');
    return await this.assetsTransactionService.updateQuantity(
      user.address,
      request,
    );
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtOrNativeAuthGuard)
  async burnQuantity(
    @Args('input', { type: () => HandleQuantityArgs })
    input: HandleQuantityArgs,
    @AuthUser() user: UserAuthResult,
  ): Promise<TransactionNode> {
    const request = UpdateQuantityRequest.fromArgs(input, 'ESDTNFTBurn');
    return await this.assetsTransactionService.burnQuantity(
      user.address,
      request,
    );
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtOrNativeAuthGuard)
  async transferNft(
    @Args('input', { type: () => TransferNftArgs }) input: TransferNftArgs,
    @AuthUser() user: UserAuthResult,
  ): Promise<TransactionNode> {
    const request = TransferNftRequest.fromArgs(input);
    return await this.assetsTransactionService.transferNft(
      user.address,
      request,
    );
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard)
  addLike(
    @Args('input', { type: () => AddLikeArgs }) input: AddLikeArgs,
    @AuthUser() user: UserAuthResult,
    @AuthorizationHeader() authorizationHeader: string,
  ): Promise<boolean> {
    return this.assetsLikesService.addLike(
      input.identifier,
      user.address,
      authorizationHeader,
    );
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard)
  removeLike(
    @Args('input', { type: () => RemoveLikeArgs }) input: RemoveLikeArgs,
    @AuthUser() user: UserAuthResult,
    @AuthorizationHeader() authorizationHeader: string,
  ): Promise<boolean> {
    return this.assetsLikesService.removeLike(
      input.identifier,
      user.address,
      authorizationHeader,
    );
  }
}

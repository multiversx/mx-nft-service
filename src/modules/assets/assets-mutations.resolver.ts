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
import { Jwt, JwtAuthenticateGuard } from '@elrondnetwork/erdnest';

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
  @UseGuards(JwtAuthenticateGuard)
  async createNft(
    @Args('input', { type: () => CreateNftArgs }) input: CreateNftArgs,
    @Args({ name: 'file', type: () => GraphQLUpload }) file: FileUpload,
    @Jwt('address') address: string,
  ): Promise<TransactionNode> {
    const request = CreateNftRequest.fromArgs(input, file);
    return await this.assetsTransactionService.createNft(address, request);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthenticateGuard)
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
  @UseGuards(JwtAuthenticateGuard)
  async addSftQuantity(
    @Args('input', { type: () => HandleQuantityArgs })
    input: HandleQuantityArgs,
    @Jwt('address') address: string,
  ): Promise<TransactionNode> {
    const request = UpdateQuantityRequest.fromArgs(input, 'ESDTNFTAddQuantity');
    return await this.assetsTransactionService.updateQuantity(address, request);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtAuthenticateGuard)
  async burnQuantity(
    @Args('input', { type: () => HandleQuantityArgs })
    input: HandleQuantityArgs,
    @Jwt('address') address: string,
  ): Promise<TransactionNode> {
    const request = UpdateQuantityRequest.fromArgs(input, 'ESDTNFTBurn');
    return await this.assetsTransactionService.burnQuantity(address, request);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtAuthenticateGuard)
  async transferNft(
    @Args('input', { type: () => TransferNftArgs }) input: TransferNftArgs,
    @Jwt('address') address: string,
  ): Promise<TransactionNode> {
    const request = TransferNftRequest.fromArgs(input);
    return await this.assetsTransactionService.transferNft(address, request);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthenticateGuard)
  addLike(
    @Args('input', { type: () => AddLikeArgs }) input: AddLikeArgs,
    @Jwt('address') address: string,
    @AuthorizationHeader() authorizationHeader: string,
  ): Promise<boolean> {
    return this.assetsLikesService.addLike(
      input.identifier,
      address,
      authorizationHeader,
    );
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthenticateGuard)
  removeLike(
    @Args('input', { type: () => RemoveLikeArgs }) input: RemoveLikeArgs,
    @Jwt('address') address: string,
    @AuthorizationHeader() authorizationHeader: string,
  ): Promise<boolean> {
    return this.assetsLikesService.removeLike(
      input.identifier,
      address,
      authorizationHeader,
    );
  }
}

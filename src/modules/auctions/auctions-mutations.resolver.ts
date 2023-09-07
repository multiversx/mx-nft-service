import { Resolver, Args, Mutation, Int } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { Auction, CreateAuctionArgs, BidActionArgs, BuySftActionArgs } from './models';
import { NftMarketplaceAbiService } from './nft-marketplace.abi.service';
import { UseGuards } from '@nestjs/common';
import { TransactionNode } from '../common/transaction';
import { CreateAuctionRequest, BidRequest, BuySftRequest } from './models/requests';
import { JwtOrNativeAuthGuard } from '../auth/jwt.or.native.auth-guard';
import { AuthUser } from '../auth/authUser';
import { UserAuthResult } from '../auth/userAuthResult';

@Resolver(() => Auction)
export class AuctionsMutationsResolver extends BaseResolver(Auction) {
  constructor(private nftAbiService: NftMarketplaceAbiService) {
    super();
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtOrNativeAuthGuard)
  async createAuction(
    @Args('input', { type: () => CreateAuctionArgs }) input: CreateAuctionArgs,
    @AuthUser() user: UserAuthResult,
  ): Promise<TransactionNode> {
    const request = CreateAuctionRequest.fromArgs(input);
    return await this.nftAbiService.createAuction(user.address, request);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtOrNativeAuthGuard)
  async endAuction(
    @Args({ name: 'auctionId', type: () => Int }) auctionId: number,
    @AuthUser() user: UserAuthResult,
  ): Promise<TransactionNode> {
    return await this.nftAbiService.endAuction(user.address, auctionId);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtOrNativeAuthGuard)
  async bid(
    @Args('input', { type: () => BidActionArgs }) input: BidActionArgs,
    @AuthUser() user: UserAuthResult,
  ): Promise<TransactionNode> {
    const request = BidRequest.fromArgs(input);
    return await this.nftAbiService.bid(user.address, request);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtOrNativeAuthGuard)
  async buySft(
    @Args('input', { type: () => BuySftActionArgs }) input: BuySftActionArgs,
    @AuthUser() user: UserAuthResult,
  ): Promise<TransactionNode> {
    const request = BuySftRequest.fromArgs(input);
    return await this.nftAbiService.buySft(user.address, request);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtOrNativeAuthGuard)
  async withdraw(
    @Args({ name: 'auctionId', type: () => Int }) auctionId: number,
    @AuthUser() user: UserAuthResult,
  ): Promise<TransactionNode> {
    return await this.nftAbiService.withdraw(user.address, auctionId);
  }
}

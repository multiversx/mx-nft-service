import { Resolver, Args, Mutation, Int } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import {
  Auction,
  CreateAuctionArgs,
  BidActionArgs,
  BuySftActionArgs,
} from './models';
import { NftMarketplaceAbiService } from './nft-marketplace.abi.service';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql.auth-guard';
import { TransactionNode } from '../common/transaction';
import { User } from '../auth/user';
import {
  CreateAuctionRequest,
  BidRequest,
  BuySftRequest,
} from './models/requests';

@Resolver(() => Auction)
export class AuctionsMutationsResolver extends BaseResolver(Auction) {
  constructor(private nftAbiService: NftMarketplaceAbiService) {
    super();
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async createAuction(
    @Args('input') input: CreateAuctionArgs,
    @User() user: any,
  ): Promise<TransactionNode> {
    const request = CreateAuctionRequest.fromArgs(input);
    return await this.nftAbiService.createAuction(user.publicKey, request);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async endAuction(
    @Args({ name: 'auctionId', type: () => Int }) auctionId: number,
    @User() user: any,
  ): Promise<TransactionNode> {
    return await this.nftAbiService.endAuction(user.publicKey, auctionId);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async bid(
    @Args('input') input: BidActionArgs,
    @User() user: any,
  ): Promise<TransactionNode> {
    const request = BidRequest.fromArgs(input);
    return await this.nftAbiService.bid(user.publicKey, request);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async buySft(
    @Args('input') input: BuySftActionArgs,
    @User() user: any,
  ): Promise<TransactionNode> {
    const request = BuySftRequest.fromArgs(input);
    return await this.nftAbiService.buySft(user.publicKey, request);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async withdraw(
    @Args({ name: 'auctionId', type: () => Int }) auctionId: number,
    @User() user: any,
  ): Promise<TransactionNode> {
    return await this.nftAbiService.withdraw(user.publicKey, auctionId);
  }
}

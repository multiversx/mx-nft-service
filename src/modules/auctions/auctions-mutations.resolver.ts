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
import { TransactionNode } from '../common/transaction';
import {
  CreateAuctionRequest,
  BidRequest,
  BuySftRequest,
} from './models/requests';
import { Jwt, JwtAuthenticateGuard } from '@elrondnetwork/erdnest';

@Resolver(() => Auction)
export class AuctionsMutationsResolver extends BaseResolver(Auction) {
  constructor(private nftAbiService: NftMarketplaceAbiService) {
    super();
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtAuthenticateGuard)
  async createAuction(
    @Args('input', { type: () => CreateAuctionArgs }) input: CreateAuctionArgs,
    @Jwt('address') address: string,
  ): Promise<TransactionNode> {
    const request = CreateAuctionRequest.fromArgs(input);
    return await this.nftAbiService.createAuction(address, request);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtAuthenticateGuard)
  async endAuction(
    @Args({ name: 'auctionId', type: () => Int }) auctionId: number,
    @Jwt('address') address: string,
  ): Promise<TransactionNode> {
    return await this.nftAbiService.endAuction(address, auctionId);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtAuthenticateGuard)
  async bid(
    @Args('input', { type: () => BidActionArgs }) input: BidActionArgs,
    @Jwt('address') address: string,
  ): Promise<TransactionNode> {
    const request = BidRequest.fromArgs(input);
    return await this.nftAbiService.bid(address, request);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtAuthenticateGuard)
  async buySft(
    @Args('input', { type: () => BuySftActionArgs }) input: BuySftActionArgs,
    @Jwt('address') address: string,
  ): Promise<TransactionNode> {
    const request = BuySftRequest.fromArgs(input);
    return await this.nftAbiService.buySft(address, request);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtAuthenticateGuard)
  async withdraw(
    @Args({ name: 'auctionId', type: () => Int }) auctionId: number,
    @Jwt('address') address: string,
  ): Promise<TransactionNode> {
    return await this.nftAbiService.withdraw(address, auctionId);
  }
}

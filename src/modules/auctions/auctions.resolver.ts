import {
  Resolver,
  Query,
  Args,
  ResolveField,
  Parent,
  Mutation,
} from '@nestjs/graphql';
import { AuctionsService } from './auctions.service';
import { BaseResolver } from '../nfts/base.resolver';
import { Account } from '../nfts/dto/account.dto';
import { Asset } from '../nfts/dto/asset.dto';
import { Auction, CreateAuctionArgs } from '../nfts/dto/auction.dto';
import { Order } from '../nfts/dto/order.dto';
import { TransactionNode } from '../nfts/dto/transaction';
import { TokenActionArgs } from './tokenActionArgs';
import { AccountsService } from '../accounts/accounts.service';
import { AssetsService } from '../assets/assets.service';
import { elrondConfig } from 'src/config';

@Resolver(() => Auction)
export class AuctionsResolver extends BaseResolver(Auction) {
  constructor(
    private auctionsService: AuctionsService,
    private accountsService: AccountsService,
    private assetsService: AssetsService,
  ) {
    super();
  }

  @Mutation(() => TransactionNode)
  async createAuction(
    @Args('auctionData') input: CreateAuctionArgs,
  ): Promise<TransactionNode> {
    return await this.auctionsService.createAuction(input);
  }

  @Mutation(() => TransactionNode)
  async bid(@Args('input') input: TokenActionArgs): Promise<TransactionNode> {
    return await this.auctionsService.bid(input);
  }

  @Mutation(() => TransactionNode)
  async endAuction(
    @Args('input') input: TokenActionArgs,
  ): Promise<TransactionNode> {
    return await this.auctionsService.endAuction(input);
  }

  @Mutation(() => TransactionNode)
  async withdraw(
    @Args('input') input: TokenActionArgs,
  ): Promise<TransactionNode> {
    return await this.auctionsService.bid(input);
  }

  @Mutation(() => Auction)
  async saveAuction(
    @Args('tokenIdentifier') tokenId: string,
    @Args('nonce') nonce: string,
  ): Promise<Auction> {
    return await this.auctionsService.saveAuction(tokenId, nonce);
  }

  @Query(() => [Auction])
  async getAuctions(@Args('ownerAddress') address: string) {
    return await this.auctionsService.getAuctions(address);
  }

  @ResolveField('owner', () => Account)
  async owner(@Parent() auction: Auction) {
    const { ownerAddress } = auction;
    return await this.accountsService.getAccountByAddress(ownerAddress);
  }

  @ResolveField('asset', () => Asset)
  async asset(@Parent() auction: Auction) {
    const { tokenIdentifier } = auction;
    return await this.assetsService.getAssetByTokenIdentifier(
      tokenIdentifier,
      elrondConfig.nftMarketplaceAddress,
    );
  }

  @ResolveField('topBidder', () => Account)
  async topBidder(@Parent() auction: Auction) {
    const { topBidder } = auction;
    return {};
  }

  @ResolveField('orders', () => [Order])
  async orders(@Parent() auction: Auction) {
    const { orders } = auction;
    return {};
  }
}

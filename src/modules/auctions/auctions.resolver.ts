import {
  Resolver,
  Query,
  Args,
  ResolveField,
  Parent,
  Mutation,
  Int,
} from '@nestjs/graphql';
import { AuctionsService } from './auctions.service';
import { BaseResolver } from '../base.resolver';
import { Account } from '../accounts/models/account.dto';
import {
  Auction,
  CreateAuctionArgs,
  BidActionArgs,
  UpdateAuctionArgs,
} from './models';
import { AccountsService } from '../accounts/accounts.service';
import { AssetsService } from '../assets/assets.service';
import { elrondConfig } from 'src/config';
import { NftMarketplaceAbiService } from './nft-marketplace.abi.service';
import { TransactionNode } from '../transaction';
import { Asset } from '../assets/models/Asset.dto';
import { Order } from '../orders/models/Order.dto';
import { OrdersService } from '../orders/order.service';
import { Price } from '../assets/models';
import AuctionResponse from './models/AuctionResonse';
import { connectionFromArraySlice } from 'graphql-relay';
import ConnectionArgs from '../ConnectionArgs';
import { FiltersExpression } from '../filtersTypes';

@Resolver(() => Auction)
export class AuctionsResolver extends BaseResolver(Auction) {
  constructor(
    private auctionsService: AuctionsService,
    private nftAbiService: NftMarketplaceAbiService,
    private accountsService: AccountsService,
    private assetsService: AssetsService,
    private ordersService: OrdersService,
  ) {
    super();
  }

  @Mutation(() => TransactionNode)
  async createAuction(
    @Args('input') input: CreateAuctionArgs,
  ): Promise<TransactionNode> {
    return await this.nftAbiService.createAuction(input);
  }

  @Mutation(() => TransactionNode)
  async endAuction(
    @Args({ name: 'auctionId', type: () => Int }) auctionId: number,
  ): Promise<TransactionNode> {
    return await this.nftAbiService.endAuction(auctionId);
  }

  @Mutation(() => Auction)
  async updateAuctionStatus(
    @Args('input') input: UpdateAuctionArgs,
  ): Promise<TransactionNode> {
    return await this.auctionsService.updateAuction(input);
  }

  @Mutation(() => TransactionNode)
  async bid(@Args('input') input: BidActionArgs): Promise<TransactionNode> {
    return await this.nftAbiService.bid(input);
  }

  @Mutation(() => TransactionNode)
  async withdraw(
    @Args({ name: 'auctionId', type: () => Int }) auctionId: number,
  ): Promise<TransactionNode> {
    return await this.nftAbiService.withdraw(auctionId);
  }

  @Mutation(() => Auction)
  async saveAuction(
    @Args({ name: 'auctionId', type: () => Int }) auctionId: number,
  ): Promise<Auction> {
    return await this.auctionsService.saveAuction(auctionId);
  }

  @Query(() => AuctionResponse)
  async auctions(
    @Args({ name: 'filters', type: () => FiltersExpression, nullable: true })
    filters,
    @Args() args: ConnectionArgs,
  ) {
    const { limit, offset } = args.pagingParams();
    const [auctions, count] = await this.auctionsService.getAuctions(
      limit,
      offset,
      filters,
    );
    const page = connectionFromArraySlice(auctions, args, {
      arrayLength: count,
      sliceStart: offset || 0,
    });
    return { page, pageData: { count, limit, offset } };
  }

  @ResolveField('owner', () => Account)
  async owner(@Parent() auction: Auction) {
    const { ownerAddress } = auction;
    return await this.accountsService.getAccountByAddress(ownerAddress);
  }

  @ResolveField('asset', () => Asset)
  async asset(@Parent() auction: Auction) {
    const { token, nonce } = auction;
    return await this.assetsService.getAssetByToken(
      elrondConfig.nftMarketplaceAddress,
      token,
      nonce,
    );
  }

  @ResolveField('topBid', () => Price)
  async topBid(@Parent() auction: Auction) {
    const { id } = auction;
    return await this.ordersService.getTopBid(id);
  }

  @ResolveField('topBidder', () => Account)
  async topBidder(@Parent() auction: Auction) {
    const { id } = auction;
    const lastOrder = await this.ordersService.getActiveOrderForAuction(id);
    return lastOrder
      ? await this.accountsService.getAccountByAddress(lastOrder.ownerAddress)
      : undefined;
  }

  @ResolveField('orders', () => [Order])
  async orders(@Parent() auction: Auction) {
    const { id } = auction;
    return await this.ordersService.getOrdersForAuction(id);
  }
}

import {
  Resolver,
  Query,
  Args,
  ResolveField,
  Parent,
  Mutation,
  Int,
  Context,
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
import { FiltersExpression, Sorting } from '../filtersTypes';
import { IGraphQLContext } from 'src/db/auctions/graphql.types';
import { QueryRequest } from '../QueryRequest';

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
    @Args({ name: 'sorting', type: () => [Sorting], nullable: true })
    sorting,
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ) {
    const { limit, offset } = pagination.pagingParams();
    const [auctions, count] = await this.auctionsService.getAuctions(
      new QueryRequest({ limit, offset, filters, sorting }),
    );
    const page = connectionFromArraySlice(auctions, pagination, {
      arrayLength: count,
      sliceStart: offset || 0,
    });
    return {
      edges: page.edges,
      pageInfo: page.pageInfo,
      pageData: { count, limit, offset },
    };
  }

  @ResolveField('owner', () => Account)
  async owner(
    @Parent() asset: Asset,
    @Context()
    { accountsLoader: accountsLoader }: IGraphQLContext,
  ) {
    const { ownerAddress } = asset;
    const owner = await accountsLoader.load(ownerAddress);
    return owner !== undefined ? owner[0] : null;
  }

  @ResolveField('asset', () => Asset)
  async asset(@Parent() auction: Auction) {
    const { token, nonce } = auction;

    return await this.assetsService.getAssetByTokenAndAddress(
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
  async orders(
    @Parent() auction: Auction,
    @Context()
    { auctionOrdersLoader: auctionOrdersLoader }: IGraphQLContext,
  ) {
    const { id } = auction;
    const orderEntities = await auctionOrdersLoader.load(id);
    return orderEntities?.map((element) => Order.fromEntity(element));
  }
}

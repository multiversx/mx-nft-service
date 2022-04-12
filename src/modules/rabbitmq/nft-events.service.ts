import { Injectable } from '@nestjs/common';
import { elrondConfig } from 'src/config';
import { AssetsRedisHandler } from '../assets';
import { AssetAvailableTokensCountRedisHandler } from '../assets/loaders/asset-available-tokens-count.redis-handler';
import {
  AuctionEventEnum,
  NftEventEnum,
} from '../assets/models/AuctionEvent.enum';
import { AuctionsGetterService, AuctionsSetterService } from '../auctions';
import { AvailableTokensForAuctionRedisHandler } from '../auctions/loaders/available-tokens-auctions.redis-handler';
import { AuctionStatusEnum } from '../auctions/models';
import { CollectionAssetsCountRedisHandler } from '../nftCollections/loaders/collection-assets-count.redis-handler';
import { CollectionAssetsRedisHandler } from '../nftCollections/loaders/collection-assets.redis-handler';
import { CreateOrderArgs, OrderStatusEnum } from '../orders/models';
import { OrdersService } from '../orders/order.service';
import {
  AuctionTokenEvent,
  BidEvent,
  BuySftEvent,
  EndAuctionEvent,
  WithdrawEvent,
} from './entities/auction';
import { MintEvent } from './entities/auction/mint.event';
import { TransferEvent } from './entities/auction/transfer.event';

@Injectable()
export class NftEventsService {
  constructor(
    private auctionsService: AuctionsSetterService,
    private auctionsGetterService: AuctionsGetterService,
    private availableTokens: AvailableTokensForAuctionRedisHandler,
    private availableTokensCount: AssetAvailableTokensCountRedisHandler,
    private collectionAssetsCount: CollectionAssetsCountRedisHandler,
    private collectionAssets: CollectionAssetsRedisHandler,
    private assetsRedisHandler: AssetsRedisHandler,
    private ordersService: OrdersService,
  ) {}

  public async handleNftAuctionEvents(auctionEvents: any[], hash: string) {
    for (let event of auctionEvents) {
      switch (event.identifier) {
        case AuctionEventEnum.BidEvent:
          const bidEvent = new BidEvent(event);
          const topics = bidEvent.getTopics();
          const auction = await this.auctionsGetterService.getAuctionById(
            parseInt(topics.auctionId, 16),
          );
          const order = await this.ordersService.createOrder(
            new CreateOrderArgs({
              ownerAddress: topics.currentWinner,
              auctionId: parseInt(topics.auctionId, 16),
              priceToken: 'EGLD',
              priceAmount: topics.currentBid,
              priceNonce: 0,
              blockHash: hash,
              status: OrderStatusEnum.Active,
            }),
          );

          this.availableTokensCount.clearKey(auction.identifier);
          if (auction.maxBidDenominated === order.priceAmountDenominated) {
            this.auctionsService.updateAuction(
              auction.id,
              AuctionStatusEnum.Claimable,
              hash,
            );
          }
          break;
        case AuctionEventEnum.BuySftEvent:
          const buySftEvent = new BuySftEvent(event);
          const buySftTopics = buySftEvent.getTopics();
          const auctionSft = await this.auctionsGetterService.getAuctionById(
            parseInt(buySftTopics.auctionId, 16),
          );
          const result = await this.auctionsGetterService.getAvailableTokens(
            parseInt(buySftTopics.auctionId, 16),
          );
          const totalRemaining = result
            ? result[0]?.availableTokens - parseFloat(buySftTopics.boughtTokens)
            : 0;
          if (totalRemaining === 0) {
            this.auctionsService.updateAuction(
              parseInt(buySftTopics.auctionId, 16),
              AuctionStatusEnum.Ended,
              hash,
            );
          }
          this.ordersService.createOrderForSft(
            new CreateOrderArgs({
              ownerAddress: buySftTopics.currentWinner,
              auctionId: parseInt(buySftTopics.auctionId, 16),
              priceToken: 'EGLD',
              priceAmount: buySftTopics.bid,
              priceNonce: 0,
              blockHash: hash,
              status: OrderStatusEnum.Bought,
              boughtTokens: buySftTopics.boughtTokens,
            }),
          );

          this.availableTokens.clearKey(auctionSft.id);
          this.availableTokensCount.clearKey(auctionSft.identifier);
          break;
        case AuctionEventEnum.WithdrawEvent:
          const withdraw = new WithdrawEvent(event);
          const topicsWithdraw = withdraw.getTopics();
          this.auctionsService.updateAuction(
            parseInt(topicsWithdraw.auctionId, 16),
            AuctionStatusEnum.Closed,
            hash,
          );
          break;
        case AuctionEventEnum.EndAuctionEvent:
          const endAuction = new EndAuctionEvent(event);
          const topicsEndAuction = endAuction.getTopics();
          this.auctionsService.updateAuction(
            parseInt(topicsEndAuction.auctionId, 16),
            AuctionStatusEnum.Ended,
            hash,
          );
          this.ordersService.updateOrder(
            parseInt(topicsEndAuction.auctionId, 16),
            OrderStatusEnum.Bought,
          );
          break;
        case AuctionEventEnum.AuctionTokenEvent:
          const auctionToken = new AuctionTokenEvent(event);
          const topicsAuctionToken = auctionToken.getTopics();
          this.auctionsService.saveAuction(
            parseInt(topicsAuctionToken.auctionId, 16),
            `${topicsAuctionToken.collection}-${topicsAuctionToken.nonce}`,
            hash,
          );
          break;
      }
    }
  }

  public async handleNftMintEvents(mintEvents: any[], hash: string) {
    for (let event of mintEvents) {
      switch (event.identifier) {
        case NftEventEnum.ESDTNFTCreate:
          const mintEvent = new MintEvent(event);
          const createTopics = mintEvent.getTopics();
          this.collectionAssets.clearKey(createTopics.collection);
          this.collectionAssetsCount.clearKey(createTopics.collection);

          break;

        case NftEventEnum.ESDTNFTTransfer:
          const transferEvent = new TransferEvent(event);
          const transferTopics = transferEvent.getTopics();
          this.assetsRedisHandler.clearKey(
            `${transferTopics.collection}-${transferTopics.nonce}`,
          );

          break;
      }
    }
  }
}

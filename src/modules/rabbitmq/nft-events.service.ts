import { Injectable } from '@nestjs/common';
import { ElrondApiService } from 'src/common';
import { ElrondFeedService } from 'src/common/services/elrond-communication/elrond-feed.service';
import {
  EventEnum,
  Feed,
} from 'src/common/services/elrond-communication/models/feed.dto';
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
    private accountFeedService: ElrondFeedService,
    private elrondApi: ElrondApiService,
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
          await this.auctionsGetterService.invalidateCache(
            topics.currentWinner,
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

          const bidNftData = await this.getNftNameAndAssets(
            auction?.identifier,
          );
          await this.accountFeedService.addFeed(
            new Feed({
              actor: topics.currentWinner,
              event: EventEnum.bid,
              reference: auction?.identifier,
              extraInfo: {
                orderId: order.id,
                nftName: bidNftData?.name,
                verified: bidNftData?.assets ? true : false,
                price: topics.currentBid,
                auctionId: parseInt(topics.auctionId, 16),
              },
            }),
          );
          this.availableTokensCount.clearKey(auction.identifier);
          if (auction.maxBidDenominated === order.priceAmountDenominated) {
            this.auctionsService.updateAuction(
              auction.id,
              AuctionStatusEnum.Claimable,
              hash,
              AuctionStatusEnum.Claimable,
            );
          }
          break;
        case AuctionEventEnum.BuySftEvent:
          const buySftEvent = new BuySftEvent(event);
          const buySftTopics = buySftEvent.getTopics();
          const identifier = `${buySftTopics.collection}-${buySftTopics.nonce}`;
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
              AuctionStatusEnum.Ended,
            );
          }
          const orderSft = await this.ordersService.createOrderForSft(
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
          const buySftNftData = await this.getNftNameAndAssets(identifier);
          await this.accountFeedService.addFeed(
            new Feed({
              actor: buySftTopics.currentWinner,
              event: EventEnum.buy,
              reference: identifier,
              extraInfo: {
                orderId: orderSft.id,
                nftName: buySftNftData?.name,
                verified: buySftNftData?.assets ? true : false,
                price: buySftTopics.bid,
                auctionId: parseInt(buySftTopics.auctionId, 16),
                boughtTokens: buySftTopics.boughtTokens,
              },
            }),
          );
          this.availableTokens.clearKey(parseInt(buySftTopics.auctionId, 16));
          this.availableTokensCount.clearKey(identifier);
          break;
        case AuctionEventEnum.WithdrawEvent:
          const withdraw = new WithdrawEvent(event);
          const topicsWithdraw = withdraw.getTopics();
          this.auctionsService.updateAuction(
            parseInt(topicsWithdraw.auctionId, 16),
            AuctionStatusEnum.Closed,
            hash,
            AuctionEventEnum.WithdrawEvent,
          );
          break;
        case AuctionEventEnum.EndAuctionEvent:
          const endAuction = new EndAuctionEvent(event);
          const topicsEndAuction = endAuction.getTopics();
          const endAuctionIdentifier = `${topicsEndAuction.collection}-${topicsEndAuction.nonce}`;
          this.auctionsService.updateAuction(
            parseInt(topicsEndAuction.auctionId, 16),
            AuctionStatusEnum.Ended,
            hash,
            AuctionEventEnum.EndAuctionEvent,
          );
          this.ordersService.updateOrder(
            parseInt(topicsEndAuction.auctionId, 16),
            OrderStatusEnum.Bought,
          );
          const endAuctionNftData = await this.getNftNameAndAssets(
            endAuctionIdentifier,
          );
          await this.accountFeedService.addFeed(
            new Feed({
              actor: topicsEndAuction.currentWinner,
              event: EventEnum.won,
              reference: endAuctionIdentifier,
              extraInfo: {
                auctionId: parseInt(topicsEndAuction.auctionId, 16),
                nftName: endAuctionNftData?.name,
                verified: endAuctionNftData?.assets ? true : false,
                price: topicsEndAuction.currentBid,
              },
            }),
          );

          break;
        case AuctionEventEnum.AuctionTokenEvent:
          const auctionToken = new AuctionTokenEvent(event);
          const topicsAuctionToken = auctionToken.getTopics();
          const startAuctionIdentifier = `${topicsAuctionToken.collection}-${topicsAuctionToken.nonce}`;
          const startAuction = await this.auctionsService.saveAuction(
            parseInt(topicsAuctionToken.auctionId, 16),
            startAuctionIdentifier,
            hash,
          );
          if (startAuction) {
            const nftData = await this.getNftNameAndAssets(
              startAuctionIdentifier,
            );
            await this.accountFeedService.addFeed(
              new Feed({
                actor: topicsAuctionToken.originalOwner,
                event: EventEnum.startAuction,
                reference: startAuctionIdentifier,
                extraInfo: {
                  auctionId: parseInt(topicsAuctionToken.auctionId, 16),
                  nftName: nftData.name,
                  verified: nftData.assets ? true : false,
                  minBid: startAuction.minBid,
                  maxBid: startAuction.maxBid,
                },
              }),
            );
          }
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
          const identifier = `${createTopics.collection}-${createTopics.nonce}`;
          this.collectionAssets.clearKey(createTopics.collection);
          this.collectionAssetsCount.clearKey(createTopics.collection);
          const collection =
            await this.elrondApi.getCollectionByIdentifierForQuery(
              createTopics.collection,
              'fields=name',
            );
          const nftData = await this.getNftNameAndAssets(identifier);
          await this.accountFeedService.addFeed(
            new Feed({
              actor: mintEvent.getAddress(),
              event: EventEnum.mintNft,
              reference: createTopics.collection,
              extraInfo: {
                identifier: identifier,
                nftName: nftData?.name,
                verified: nftData?.assets ? true : false,
                collectionName: collection?.name,
              },
            }),
          );

          break;

        case NftEventEnum.ESDTNFTTransfer:
          const transferEvent = new TransferEvent(event);
          const transferTopics = transferEvent.getTopics();
          this.assetsRedisHandler.clearKey(
            `${transferTopics.collection}-${transferTopics.nonce}`,
          );

          break;

        case NftEventEnum.MultiESDTNFTTransfer:
          const multiTransferEvent = new TransferEvent(event);
          const multiTransferTopics = multiTransferEvent.getTopics();
          this.assetsRedisHandler.clearKey(
            `${multiTransferTopics.collection}-${multiTransferTopics.nonce}`,
          );

          break;
      }
    }
  }

  private async getNftNameAndAssets(identifier: string) {
    const nft = await this.elrondApi.getNftByIdentifierForQuery(
      identifier,
      '?fields=name,assets',
    );
    return nft;
  }
}

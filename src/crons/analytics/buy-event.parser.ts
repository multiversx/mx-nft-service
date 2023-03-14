import { Injectable, Logger } from '@nestjs/common';
import { AuctionEntity } from 'src/db/auctions';
import {
  ElrondNftsSwapAuctionEventEnum,
  ExternalAuctionEventEnum,
} from 'src/modules/assets/models';
import { AuctionsGetterService } from 'src/modules/auctions';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { BuySftEvent } from 'src/modules/rabbitmq/entities/auction';
import { ClaimEvent } from 'src/modules/rabbitmq/entities/auction/claim.event';
import { ElrondSwapBuyEvent } from 'src/modules/rabbitmq/entities/auction/elrondnftswap/elrondswap-buy.event';

@Injectable()
export class BuyEventParser {
  constructor(
    private auctionsGetterService: AuctionsGetterService,
    private readonly marketplaceService: MarketplacesService,
  ) {}

  async handle(event: any) {
    const { buySftEvent, topics } = this.getEventAndTopics(event);
    let auction: AuctionEntity;

    const marketplace = await this.marketplaceService.getMarketplaceByAddress(
      buySftEvent.getAddress(),
    );

    if (!marketplace) return;

    if (topics.auctionId) {
      auction = await this.auctionsGetterService.getAuctionByIdAndMarketplace(
        parseInt(topics.auctionId, 16),
        marketplace.key,
      );
    } else {
      const auctionIdentifier = `${topics.collection}-${topics.nonce}`;
      auction =
        await this.auctionsGetterService.getAuctionByIdentifierAndMarketplace(
          auctionIdentifier,
          marketplace.key,
        );
    }
    if (!auction) return;

    return [
      {
        collection: topics.collection,
        paymentToken: auction.paymentToken,
        paymentNonce: auction.paymentNonce,
        value: topics.bid === '0' && auction ? auction.minBid : topics.bid,
      },
      event.getTimestamp(),
    ];
  }

  private getEventAndTopics(event: any) {
    if (event.identifier === ElrondNftsSwapAuctionEventEnum.Purchase) {
      if (
        Buffer.from(event.topics[0], 'base64').toString() ===
        ElrondNftsSwapAuctionEventEnum.UpdateListing
      ) {
        return;
      }
      const buySftEvent = new ElrondSwapBuyEvent(event);
      const topics = buySftEvent.getTopics();
      return { buySftEvent, topics };
    }

    if (event.identifier === ExternalAuctionEventEnum.BuyNft) {
      const buySftEvent = new ClaimEvent(event);
      const topics = buySftEvent.getTopics();
      return { buySftEvent, topics };
    }
    const buySftEvent = new BuySftEvent(event);
    const topics = buySftEvent.getTopics();
    return { buySftEvent, topics };
  }
}

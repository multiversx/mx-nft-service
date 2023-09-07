import { Injectable, Logger } from '@nestjs/common';
import { AuctionEntity } from 'src/db/auctions';
import { KroganSwapAuctionEventEnum, ExternalAuctionEventEnum } from 'src/modules/assets/models';
import { AuctionsGetterService } from 'src/modules/auctions';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { BuySftEvent } from '../../rabbitmq/entities/auction';
import { ClaimEvent } from '../../rabbitmq/entities/auction/claim.event';
import { ElrondSwapBuyEvent } from '../../rabbitmq/entities/auction/elrondnftswap/elrondswap-buy.event';

@Injectable()
export class BuyEventParser {
  private readonly logger = new Logger(BuyEventParser.name);
  constructor(private auctionsGetterService: AuctionsGetterService, private readonly marketplaceService: MarketplacesService) {}

  async handle(event: any, hash: string) {
    const { buySftEvent, topics } = this.getEventAndTopics(event, hash);
    let auction: AuctionEntity;

    const marketplace = await this.marketplaceService.getMarketplaceByAddress(buySftEvent.getAddress());

    if (!marketplace) return;

    if (topics.auctionId) {
      auction = await this.auctionsGetterService.getAuctionByIdAndMarketplace(parseInt(topics.auctionId, 16), marketplace.key);
    } else {
      const auctionIdentifier = `${topics.collection}-${topics.nonce}`;
      auction = await this.auctionsGetterService.getAuctionByIdentifierAndMarketplace(auctionIdentifier, marketplace.key);
    }
    if (!auction) return;

    return {
      paymentToken: auction.paymentToken,
      paymentNonce: auction.paymentNonce,
      collection: topics.collection,
      value: topics.bid === '0' && auction ? auction.minBid : topics.bid,
    };
  }

  private getEventAndTopics(event: any, hash: string) {
    if (event.identifier === KroganSwapAuctionEventEnum.Purchase) {
      if (Buffer.from(event.topics[0], 'base64').toString() === KroganSwapAuctionEventEnum.UpdateListing) {
        this.logger.log(
          `Update Listing event detected for hash '${hash}' at Purchase external marketplace ${event.address}, ignore it for the moment`,
        );
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

import { Injectable, Logger } from '@nestjs/common';
import { AuctionsSetterService } from 'src/modules/auctions';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { Marketplace } from 'src/modules/marketplaces/models';
import { MarketplaceTypeEnum } from 'src/modules/marketplaces/models/MarketplaceType.enum';
import { AuctionTokenEvent } from '../../entities/auction';
import { FeedEventsSenderService } from '../feed-events.service';

@Injectable()
export class StartAuctionEventHandler {
  private readonly logger = new Logger(StartAuctionEventHandler.name);
  constructor(
    private auctionsService: AuctionsSetterService,
    private feedEventsSenderService: FeedEventsSenderService,
    private readonly marketplaceService: MarketplacesService,
  ) {}

  async handle(event: any, hash: string, marketplaceType: MarketplaceTypeEnum) {
    const auctionToken = new AuctionTokenEvent(event);
    const topicsAuctionToken = auctionToken.getTopics();
    const startAuctionIdentifier = `${topicsAuctionToken.collection}-${topicsAuctionToken.nonce}`;
    const auctionTokenMarketplace: Marketplace =
      await this.marketplaceService.getMarketplaceByType(
        auctionToken.getAddress(),
        marketplaceType,
        topicsAuctionToken.collection,
      );

    if (!auctionTokenMarketplace) return;
    this.logger.log(
      `Auction listing event detected for hash '${hash}' and marketplace '${auctionTokenMarketplace?.name}'`,
    );
    const startAuction = await this.auctionsService.saveAuction(
      parseInt(topicsAuctionToken.auctionId, 16),
      startAuctionIdentifier,
      auctionTokenMarketplace,
      hash,
    );

    if (!startAuction) return;

    await this.feedEventsSenderService.sendStartAuctionEvent(
      topicsAuctionToken,
      startAuction,
      auctionTokenMarketplace,
    );
  }
}

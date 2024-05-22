import { BinaryUtils } from '@multiversx/sdk-nestjs-common';
import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { AuctionEntity } from 'src/db/auctions';
import { ExternalAuctionEventEnum } from 'src/modules/assets/models';
import { AuctionsGetterService, AuctionsSetterService } from 'src/modules/auctions';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { Token } from 'src/modules/usdPrice/Token.model';
import { UsdPriceService } from 'src/modules/usdPrice/usd-price.service';
import { BigNumberUtils } from 'src/utils/bigNumber-utils';
import { UpdateListingEvent } from '../../entities/auction-reindex/updateListing.event';
import { Marketplace } from 'src/modules/marketplaces/models';
import { EventLog } from 'src/modules/metrics/rabbitEvent';

@Injectable()
export class UpdateListingEventHandler {
  private readonly logger = new Logger(UpdateListingEventHandler.name);
  constructor(
    private auctionsGetterService: AuctionsGetterService,
    private auctionsService: AuctionsSetterService,
    @Inject(forwardRef(() => MarketplacesService))
    private readonly marketplaceService: MarketplacesService,
    private usdPriceService: UsdPriceService,
  ) { }

  async handle(event: EventLog, marketplace: Marketplace) {
    try {
      const updateListingEvent = new UpdateListingEvent(event);
      const topics = updateListingEvent.getTopics();
      marketplace = await this.marketplaceService.getMarketplaceByType(updateListingEvent.address, marketplace.type, topics.collection);
      this.logger.log(
        `${updateListingEvent.identifier} listing event detected for marketplace '${marketplace?.name}'`,
      );
      let auction = await this.auctionsGetterService.getAuctionByIdAndMarketplace(parseInt(topics.auctionId, 16), marketplace.key);

      if (auction && marketplace) {
        const paymentToken = await this.usdPriceService.getToken(auction.paymentToken);

        this.updateAuctionListing(auction, updateListingEvent, paymentToken, 'hash');

        this.auctionsService.updateAuction(auction, ExternalAuctionEventEnum.UpdateListing);
      }
    } catch (error) {
      console.error('An errror occured while handling bid event', error);
    }
  }

  private updateAuctionListing(auction: AuctionEntity, event: UpdateListingEvent, paymentToken: Token, hash: string) {
    const eventTopics = event.getTopics();

    if (eventTopics.newBid) {
      auction.minBid = eventTopics.newBid;
      auction.minBidDenominated = BigNumberUtils.denominateAmount(eventTopics.newBid, paymentToken.decimals);
      auction.maxBid = auction.minBid;
      auction.maxBidDenominated = auction.minBidDenominated;
    }

    if (eventTopics.deadline) {
      auction.endDate = eventTopics.deadline;
    }

    if (eventTopics.paymentToken) {
      auction.paymentToken = eventTopics.paymentToken;
      auction.paymentNonce = BinaryUtils.hexToNumber(eventTopics.paymentTokenNonce);
    }

    auction.blockHash = hash;
  }
}

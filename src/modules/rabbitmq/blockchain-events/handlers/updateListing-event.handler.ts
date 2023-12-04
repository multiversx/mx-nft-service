import { BinaryUtils } from '@multiversx/sdk-nestjs-common';
import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { AuctionEntity } from 'src/db/auctions';
import { ExternalAuctionEventEnum } from 'src/modules/assets/models';
import { AuctionsGetterService, AuctionsSetterService } from 'src/modules/auctions';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { MarketplaceTypeEnum } from 'src/modules/marketplaces/models/MarketplaceType.enum';
import { Token } from 'src/modules/usdPrice/Token.model';
import { UsdPriceService } from 'src/modules/usdPrice/usd-price.service';
import { BigNumberUtils } from 'src/utils/bigNumber-utils';
import { UpdateListingEvent } from '../../entities/auction/updateListing.event';

@Injectable()
export class UpdateListingEventHandler {
  private readonly logger = new Logger(UpdateListingEventHandler.name);
  constructor(
    private auctionsGetterService: AuctionsGetterService,
    private auctionsService: AuctionsSetterService,
    @Inject(forwardRef(() => MarketplacesService))
    private readonly marketplaceService: MarketplacesService,
    private usdPriceService: UsdPriceService,
  ) {}

  async handle(event: any, hash: string, marketplaceType: MarketplaceTypeEnum) {
    const updateListingEvent = new UpdateListingEvent(event);
    const topics = updateListingEvent.getTopics();
    const marketplace = await this.marketplaceService.getMarketplaceByType(
      updateListingEvent.getAddress(),
      marketplaceType,
      topics.collection,
    );
    this.logger.log(
      `${updateListingEvent.getIdentifier()} listing event detected for hash '${hash}' and marketplace '${marketplace?.name}'`,
    );
    let auction = await this.auctionsGetterService.getAuctionByIdAndMarketplace(parseInt(topics.auctionId, 16), marketplace.key);

    if (auction && marketplace) {
      const paymentToken = await this.usdPriceService.getToken(auction.paymentToken);

      this.updateAuctionListing(auction, updateListingEvent, paymentToken, hash);

      this.auctionsService.updateAuction(auction, ExternalAuctionEventEnum.UpdateListing);
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

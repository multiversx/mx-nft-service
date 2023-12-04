import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { mxConfig } from 'src/config';
import { AuctionEntity } from 'src/db/auctions';
import { ExternalAuctionEventEnum } from 'src/modules/assets/models';
import { AuctionsGetterService, AuctionsSetterService, NftMarketplaceAbiService } from 'src/modules/auctions';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { Marketplace } from 'src/modules/marketplaces/models';
import { MarketplaceTypeEnum } from 'src/modules/marketplaces/models/MarketplaceType.enum';
import { UsdPriceService } from 'src/modules/usdPrice/usd-price.service';
import { BigNumberUtils } from 'src/utils/bigNumber-utils';
import { DEADRARE_KEY } from 'src/utils/constants';
import { UpdatePriceEvent } from '../../entities/auction/updatePrice.event';

@Injectable()
export class UpdatePriceEventHandler {
  private readonly logger = new Logger(UpdatePriceEventHandler.name);
  constructor(
    private auctionsGetterService: AuctionsGetterService,
    private auctionsService: AuctionsSetterService,
    @Inject(forwardRef(() => MarketplacesService))
    private readonly marketplaceService: MarketplacesService,
    private usdPriceService: UsdPriceService,
    private nftAbiService: NftMarketplaceAbiService,
  ) {}

  async handle(event: any, hash: string, marketplaceType: MarketplaceTypeEnum) {
    const updatePriceEvent = new UpdatePriceEvent(event);
    const topics = updatePriceEvent.getTopics();
    const marketplace = await this.marketplaceService.getMarketplaceByType(
      updatePriceEvent.getAddress(),
      marketplaceType,
      topics.collection,
    );
    this.logger.log(`${updatePriceEvent.getIdentifier()} event detected for hash '${hash}' and marketplace '${marketplace?.name}'`);
    let auction = await this.auctionsGetterService.getAuctionByIdAndMarketplace(parseInt(topics.auctionId, 16), marketplace.key);
    let newPrice: string = await this.getNewPrice(marketplace, topics);
    if (auction && newPrice) {
      const paymentToken = await this.usdPriceService.getToken(auction.paymentToken);
      this.updateAuctionPrice(auction, newPrice, hash, paymentToken?.decimals);

      this.auctionsService.updateAuction(auction, ExternalAuctionEventEnum.UpdatePrice);
    }
  }

  private async getNewPrice(
    updatePriceMarketplace: Marketplace,
    topicsUpdatePrice: {
      collection: string;
      nonce: string;
      auctionId: string;
      newBid: string;
    },
  ) {
    if (updatePriceMarketplace.key === DEADRARE_KEY) {
      const auction = await this.nftAbiService.getAuctionQuery(parseInt(topicsUpdatePrice.auctionId, 16), updatePriceMarketplace);
      if (auction) {
        return auction.min_bid.valueOf().toString();
      }
    }

    return topicsUpdatePrice.newBid;
  }

  private updateAuctionPrice(updatedAuction: AuctionEntity, newBid: string, hash: string, decimals: number = mxConfig.decimals) {
    updatedAuction.minBid = newBid;
    updatedAuction.minBidDenominated = BigNumberUtils.denominateAmount(newBid, decimals);
    updatedAuction.maxBid = newBid;
    updatedAuction.maxBidDenominated = BigNumberUtils.denominateAmount(newBid, decimals);
    updatedAuction.blockHash = hash;
  }
}

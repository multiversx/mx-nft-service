import { Injectable, Logger } from '@nestjs/common';
import { elrondConfig } from 'src/config';
import { AuctionEntity } from 'src/db/auctions';
import { ExternalAuctionEventEnum } from 'src/modules/assets/models';
import {
  AuctionsGetterService,
  AuctionsSetterService,
  NftMarketplaceAbiService,
} from 'src/modules/auctions';
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
    private readonly marketplaceService: MarketplacesService,
    private usdPriceService: UsdPriceService,
    private nftAbiService: NftMarketplaceAbiService,
  ) {}

  async handle(event: any, hash: string, marketplaceType: MarketplaceTypeEnum) {
    const updatePriceEvent = new UpdatePriceEvent(event);
    const topicsUpdatePrice = updatePriceEvent.getTopics();
    const updatePriceMarketplace: Marketplace =
      await this.marketplaceService.getMarketplaceByType(
        updatePriceEvent.getAddress(),
        marketplaceType,
        topicsUpdatePrice.collection,
      );
    this.logger.log(
      `Update price event detected for hash '${hash}' and marketplace '${updatePriceMarketplace?.name}'`,
    );
    let updatePriceAuction =
      await this.auctionsGetterService.getAuctionByIdAndMarketplace(
        parseInt(topicsUpdatePrice.auctionId, 16),
        updatePriceMarketplace.key,
      );
    let newPrice: string = await this.getNewPrice(
      updatePriceMarketplace,
      topicsUpdatePrice,
    );
    if (updatePriceAuction && newPrice) {
      const paymentToken = await this.usdPriceService.getToken(
        updatePriceAuction.paymentToken,
      );
      this.updateAuctionPrice(
        updatePriceAuction,
        newPrice,
        hash,
        paymentToken?.decimals,
      );

      this.auctionsService.updateAuction(
        updatePriceAuction,
        ExternalAuctionEventEnum.UpdatePrice,
      );
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
      const auction = await this.nftAbiService.getAuctionQuery(
        parseInt(topicsUpdatePrice.auctionId, 16),
        updatePriceMarketplace,
      );
      if (auction) {
        return auction.min_bid.valueOf().toString();
      }
    }

    return topicsUpdatePrice.newBid;
  }

  private updateAuctionPrice(
    changePriceAuction: AuctionEntity,
    newBid: string,
    hash: string,
    decimals: number = elrondConfig.decimals,
  ) {
    changePriceAuction.minBid = newBid;
    changePriceAuction.minBidDenominated = BigNumberUtils.denominateAmount(
      newBid,
      decimals,
    );
    changePriceAuction.maxBid = newBid;
    changePriceAuction.maxBidDenominated = BigNumberUtils.denominateAmount(
      newBid,
      decimals,
    );
    changePriceAuction.blockHash = hash;
  }
}
import { Injectable, Logger } from '@nestjs/common';
import {
  AuctionEventEnum,
  ElrondNftsSwapAuctionEventEnum,
} from 'src/modules/assets/models';
import {
  AuctionsGetterService,
  AuctionsSetterService,
} from 'src/modules/auctions';
import { AuctionStatusEnum } from 'src/modules/auctions/models';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { Marketplace } from 'src/modules/marketplaces/models';
import { MarketplaceTypeEnum } from 'src/modules/marketplaces/models/MarketplaceType.enum';
import { WithdrawEvent } from '../../entities/auction';
import { ElrondSwapWithdrawEvent } from '../../entities/auction/elrondnftswap/elrondswap-withdraw.event';

@Injectable()
export class WithdrawAuctionEventHandler {
  private readonly logger = new Logger(WithdrawAuctionEventHandler.name);
  constructor(
    private auctionsGetterService: AuctionsGetterService,
    private auctionsService: AuctionsSetterService,
    private readonly marketplaceService: MarketplacesService,
  ) {}

  async handle(event: any, hash: string, marketplaceType: MarketplaceTypeEnum) {
    const { withdraw, topics } = this.getEventAndTopics(event);
    const marketplace = await this.marketplaceService.getMarketplaceByType(
      withdraw.getAddress(),
      marketplaceType,
      topics.collection,
    );
    if (!marketplace) return;

    this.logger.log(
      `Withdraw event detected for hash '${hash}' and marketplace '${marketplace?.name}'`,
    );
    const auction =
      await this.auctionsGetterService.getAuctionByIdAndMarketplace(
        parseInt(topics.auctionId, 16),
        marketplace.key,
      );

    if (!auction) return;

    this.auctionsService.updateAuctionStatus(
      auction.id,
      AuctionStatusEnum.Closed,
      hash,
      AuctionEventEnum.WithdrawEvent,
    );
  }

  private getEventAndTopics(event: any) {
    if (event.identifier === ElrondNftsSwapAuctionEventEnum.WithdrawSwap) {
      const withdraw = new ElrondSwapWithdrawEvent(event);
      const topics = withdraw.getTopics();
      return { withdraw, topics };
    }
    const withdraw = new WithdrawEvent(event);
    const topics = withdraw.getTopics();
    return { withdraw, topics };
  }
}

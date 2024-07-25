import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { AuctionEntity } from 'src/db/auctions';
import { AuctionEventEnum, KroganSwapAuctionEventEnum, ExternalAuctionEventEnum } from 'src/modules/assets/models';
import { AuctionsGetterService, AuctionsSetterService } from 'src/modules/auctions';
import { AuctionStatusEnum } from 'src/modules/auctions/models';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { WithdrawEvent } from '../../entities/auction-reindex';
import { ClaimEvent } from '../../entities/auction-reindex/claim.event';
import { ElrondSwapWithdrawEvent } from '../../entities/auction-reindex/elrondnftswap/elrondswap-withdraw.event';
import { Marketplace } from 'src/modules/marketplaces/models';
import { EventLog } from 'src/modules/metrics/rabbitEvent';

@Injectable()
export class WithdrawAuctionEventHandler {
  private readonly logger = new Logger(WithdrawAuctionEventHandler.name);
  constructor(
    private auctionsGetterService: AuctionsGetterService,
    private auctionsService: AuctionsSetterService,
    @Inject(forwardRef(() => MarketplacesService))
    private readonly marketplaceService: MarketplacesService,
  ) { }

  async handle(event: EventLog, marketplace: Marketplace) {
    try {
      const { withdraw, topics } = this.getEventAndTopics(event);
      let auction: AuctionEntity;
      marketplace = await this.marketplaceService.getMarketplaceByType(withdraw.address, marketplace.type, topics.collection);
      if (!marketplace) return;

      this.logger.log(`${withdraw.identifier} event detected for marketplace '${marketplace?.name}'`);
      if (topics.auctionId) {
        auction = await this.auctionsGetterService.getAuctionByIdAndMarketplace(parseInt(topics.auctionId, 16), marketplace.key);
      } else {
        const auctionIdentifier = `${topics.collection}-${topics.nonce}`;
        auction = await this.auctionsGetterService.getAuctionByIdentifierAndMarketplace(auctionIdentifier, marketplace.key);
      }

      if (!auction) return;

      this.auctionsService.updateAuctionStatus(auction.id, AuctionStatusEnum.Closed, 'hash', AuctionEventEnum.WithdrawEvent);
    } catch (error) {
      console.error('An errror occured while handling bid event', error);
    }
  }

  private getEventAndTopics(event: EventLog) {
    if (event.identifier === KroganSwapAuctionEventEnum.WithdrawSwap) {
      const withdraw = new ElrondSwapWithdrawEvent(event);
      const topics = withdraw.getTopics();
      return { withdraw, topics };
    }

    if (event.identifier === ExternalAuctionEventEnum.ClaimBackNft) {
      const withdraw = new ClaimEvent(event);
      const topics = withdraw.getTopics();
      return { withdraw, topics };
    }

    const withdraw = new WithdrawEvent(event);
    const topics = withdraw.getTopics();
    return { withdraw, topics };
  }
}

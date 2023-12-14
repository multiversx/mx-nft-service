import { Injectable } from '@nestjs/common';
import { MinterEventEnum } from '../../assets/models/AuctionEvent.enum';
import { CampaignsService } from '../../campaigns/campaigns.service';
import { BrandCreatedEvent } from '../entities/auction/brandCreated.event';
import { RandomNftEvent } from '../entities/auction/randomNft.event';
import { CacheEventsPublisherService } from '../cache-invalidation/cache-invalidation-publisher/change-events-publisher.service';
import { ChangedEvent, CacheEventTypeEnum } from '../cache-invalidation/events/changed.event';

@Injectable()
export class MinterEventsService {
  constructor(private campaignService: CampaignsService, private readonly cacheEventsPublisher: CacheEventsPublisherService) {}

  public async handleNftMinterEvents(mintEvents: any[], hash: string) {
    for (let event of mintEvents) {
      switch (event.identifier) {
        case MinterEventEnum.callBack:
          const brandEvent = new BrandCreatedEvent(event);
          const topics = brandEvent.getTopics();
          if (topics.eventIdentifier === MinterEventEnum.brandCreated) {
            const address = brandEvent.getAddress();
            await this.campaignService.saveCampaign(address);
          }
          await this.triggerCacheInvalidation();

          break;

        case MinterEventEnum.buyRandomNft:
          const randomNftEvent = new RandomNftEvent(event);
          const transferTopics = randomNftEvent.getTopics();

          const tier = await this.campaignService.updateTier(
            randomNftEvent.getAddress(),
            transferTopics.campaignId,
            transferTopics.tier,
            randomNftEvent.getData(),
          );
          if (tier) {
            await this.triggerCacheInvalidation();
          }

          break;
      }
    }
  }

  private async triggerCacheInvalidation(): Promise<void> {
    await this.cacheEventsPublisher.publish(
      new ChangedEvent({
        type: CacheEventTypeEnum.Campaigns,
      }),
    );
  }
}

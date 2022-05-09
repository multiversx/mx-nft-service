import { Injectable } from '@nestjs/common';
import { MinterEventEnum } from '../assets/models/AuctionEvent.enum';
import { CampaignsService } from '../campaigns/campaigns.service';
import { BrandCreatedEvent } from './entities/auction/brandCreated.event';
import { RandomNftEvent } from './entities/auction/randomNft.event';

@Injectable()
export class MinterEventsService {
  constructor(private campaignService: CampaignsService) {}

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
          break;

        case MinterEventEnum.buyRandomNft:
          const randomNftEvent = new RandomNftEvent(event);
          const transferTopics = randomNftEvent.getTopics();
          await this.campaignService.updateTier(
            randomNftEvent.getAddress(),
            transferTopics.campaignId,
            transferTopics.tier,
            transferTopics.boughtNfts,
          );
          break;
      }
    }
  }
}

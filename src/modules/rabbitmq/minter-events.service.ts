import { Injectable } from '@nestjs/common';
import { TimeConstants } from 'src/utils/time-utils';
import { MinterEventEnum } from '../assets/models/AuctionEvent.enum';
import { CampaignsService } from '../campaigns/campaigns.service';
import { BrandCreatedEvent } from './entities/auction/brandCreated.event';
import { RandomNftEvent } from './entities/auction/randomNft.event';

@Injectable()
export class MinterEventsService {
  constructor(private campaignService: CampaignsService) {}

  public async handleNftMinterEvents(mintEvents: any[], hash: string) {
    for (let event of mintEvents) {
      console.log('for event', event);
      switch (event.identifier) {
        case MinterEventEnum.callBack:
          console.log('callBack', event);
          const brandEvent = new BrandCreatedEvent(event);
          const topics = brandEvent.getTopics();
          if (topics.eventIdentifier === MinterEventEnum.brandCreated) {
            const address = brandEvent.getAddress();
            await this.campaignService.saveCampaign(address);
          }
          await this.campaignService.invalidateKey();

          break;

        case MinterEventEnum.buyRandomNft:
          console.log('buy random', event);
          const randomNftEvent = new RandomNftEvent(event);
          const transferTopics = randomNftEvent.getTopics();

          console.log('data', randomNftEvent.getData());

          const tier = await this.campaignService.updateTier(
            randomNftEvent.getAddress(),
            transferTopics.campaignId,
            transferTopics.tier,
            randomNftEvent.getData(),
          );
          if (tier) {
            console.log('update tier');
            await this.campaignService.invalidateKey();
          }

          break;
      }
    }
  }
}

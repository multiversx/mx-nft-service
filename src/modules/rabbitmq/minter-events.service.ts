import { Injectable } from '@nestjs/common';
import { MinterEventEnum } from '../assets/models/AuctionEvent.enum';
import { CampaignsService } from '../campaigns/campaigns.service';
import { RandomNftEvent } from './entities/auction/randomNft.event';
import { GenericEvent } from './entities/generic.event';

@Injectable()
export class MinterEventsService {
  constructor(private campaignService: CampaignsService) {}

  public async handleNftMintEvents(mintEvents: any[], hash: string) {
    console.log({ mintEvents });
    for (let event of mintEvents) {
      console.log({ event });
      switch (event.identifier) {
        case MinterEventEnum.brandCreated:
          const brandEvent = new GenericEvent(event);
          const address = brandEvent.getAddress();
          await this.campaignService.saveCampaign(address);
          break;

        case MinterEventEnum.nftBought:
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

import { Injectable } from '@nestjs/common';
import { ElrondApiService, ElrondElasticService } from 'src/common';
import { NftFlagsEntity, NftsFlagsRepository } from 'src/db/nftFlags';
import { NftEventEnum } from '../assets/models/AuctionEvent.enum';
import { VerifyContentService } from '../assets/verify-content.service';
import { MintEvent } from './entities/auction/mint.event';

@Injectable()
export class ElasticUpdatesEventsService {
  constructor(
    private elrondApi: ElrondApiService,
    private verifyContent: VerifyContentService,
    private elasticUpdater: ElrondElasticService,
    private nftFlags: NftsFlagsRepository,
  ) {}

  public async handleNftMintEvents(mintEvents: any[], hash: string) {
    for (let event of mintEvents) {
      console.log(event);
      switch (event.identifier) {
        case NftEventEnum.ESDTNFTCreate:
          const mintEvent = new MintEvent(event);
          const createTopics = mintEvent.getTopics();
          const identifier = `${createTopics.collection}-${createTopics.nonce}`;
          const nft = await this.elrondApi.getNftByIdentifierForQuery(
            identifier,
            '?fields=media',
          );
          const value = await this.verifyContent.checkContentSensitivityForUrl(
            nft.media[0].originalUrl,
            nft.media[0].fileType,
          );
          await this.nftFlags.addFlag(
            new NftFlagsEntity({
              identifier: identifier,
              nsfw: +value.toFixed(2),
            }),
          );
          await this.elasticUpdater.setCustomValue(
            'tokens',
            identifier,
            'nsfw',
            +value.toFixed(2),
          );

          break;
      }
    }
  }
}

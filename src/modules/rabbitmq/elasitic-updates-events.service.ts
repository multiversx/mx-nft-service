import { Injectable } from '@nestjs/common';
import { ElrondApiService, ElrondElasticService } from 'src/common';
import { NftRarityRepository } from 'src/db/nft-rarity/nft-rarity.repository';
import { NftFlagsEntity, NftsFlagsRepository } from 'src/db/nftFlags';
import { DeleteResult } from 'typeorm';
import { NftTypeEnum } from '../assets/models';
import { NftEventEnum } from '../assets/models/AuctionEvent.enum';
import { VerifyContentService } from '../assets/verify-content.service';
import { NftRarityService } from '../nft-rarity/nft-rarity.service';
import { MintEvent } from './entities/auction/mint.event';

@Injectable()
export class ElasticUpdatesEventsService {
  constructor(
    private elrondApi: ElrondApiService,
    private verifyContent: VerifyContentService,
    private elasticUpdater: ElrondElasticService,
    private nftFlags: NftsFlagsRepository,
    private readonly nftRarityService: NftRarityService,
  ) {}

  public async handleNftMintEvents(
    mintEvents: any[],
    hash: string,
  ): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    for (let event of mintEvents) {
      switch (event.identifier) {
        case NftEventEnum.ESDTNFTCreate:
          const mintEvent = new MintEvent(event);
          const createTopics = mintEvent.getTopics();
          const identifier = `${createTopics.collection}-${createTopics.nonce}`;
          const nft = await this.elrondApi.getNftByIdentifierForQuery(
            identifier,
            'fields=media',
          );
          if (nft?.media && nft.media.length > 0) {
            const value =
              await this.verifyContent.checkContentSensitivityForUrl(
                nft?.media[0].url || nft?.media[0].originalUrl,
                nft?.media[0].fileType,
              );
            await this.nftFlags.addFlag(
              new NftFlagsEntity({
                identifier: identifier,
                nsfw: Number(value.toFixed(2)),
              }),
            );
            await this.elasticUpdater.setCustomValue(
              'tokens',
              identifier,
              this.elasticUpdater.buildUpdateBody(
                'nft_nsfw',
                Number(value.toFixed(2)),
              ),
            );
          }
          break;
      }
    }
  }

  public async handleRaritiesForNftMintAndBurnEvents(
    mintEvents: any[],
  ): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 10000));

    let collectionsToUpdate: string[] = [];
    let nftsToDelete: string[] = [];

    for (let event of mintEvents) {
      const mintEvent = new MintEvent(event);
      const createTopics = mintEvent.getTopics();
      console.log(createTopics);
      const identifier = `${createTopics.collection}-${createTopics.nonce}`;
      console.log(identifier);
      const nft = await this.elrondApi.getNftByIdentifierForQuery(
        identifier,
        'fields=type,collection',
      );

      if (
        (nft && nft.type === NftTypeEnum.NonFungibleESDT) ||
        NftTypeEnum.SemiFungibleESDT
      ) {
        {
          collectionsToUpdate.push(nft.collection);
        }

        if (nft && event.identifier === NftEventEnum.ESDTNFTBurn)
          nftsToDelete.push(nft.identifier);
      }
    }

    collectionsToUpdate = [...new Set(collectionsToUpdate)];

    const updates: Promise<boolean>[] = collectionsToUpdate.map((c) => {
      return this.nftRarityService.updateRarities(c);
    });

    const deletes: Promise<DeleteResult>[] = nftsToDelete.map((n) => {
      return this.nftRarityService.deleteNftRarity(n);
    });

    await Promise.all(updates);
    await Promise.all(deletes);
  }
}

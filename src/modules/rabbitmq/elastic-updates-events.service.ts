import { Injectable } from '@nestjs/common';
import { ElrondApiService } from 'src/common';
import { DeleteResult } from 'typeorm/query-builder/result/DeleteResult';
import { NftEventEnum } from '../assets/models/AuctionEvent.enum';
import { NftTypeEnum } from '../assets/models/NftTypes.enum';
import { NftRarityService } from '../nft-rarity/nft-rarity.service';
import { FlagNftService } from '../admins/flag-nft.service';
import { MintEvent } from './entities/auction/mint.event';
import { ElasticRarityUpdaterService } from 'src/crons/elastic.updater/elastic-rarity.updater.service';

@Injectable()
export class ElasticUpdatesEventsService {
  constructor(
    private readonly nftFlagsService: FlagNftService,
    private readonly elrondApi: ElrondApiService,
    private readonly nftRarityService: NftRarityService,
    private readonly rarityUpdater: ElasticRarityUpdaterService,
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
          await this.nftFlagsService.updateNftFlag(identifier);
          break;
      }
    }
  }

  public async handleRaritiesForNftMintAndBurnEvents(
    mintEvents: any[],
  ): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 5000));

    let collectionsToUpdate: string[] = [];
    let nftsToDelete: string[] = [];

    for (let event of mintEvents) {
      const mintEvent = new MintEvent(event);
      const createTopics = mintEvent.getTopics();
      const identifier = `${createTopics.collection}-${createTopics.nonce}`;
      const nft = await this.elrondApi.getNftByIdentifierForQuery(
        identifier,
        '?fields=type,collection',
      );

      if (!nft || Object.keys(nft).length === 0) {
        return;
      }

      if (
        nft.type === NftTypeEnum.NonFungibleESDT ||
        nft.type === NftTypeEnum.SemiFungibleESDT
      ) {
        collectionsToUpdate.push(nft.collection);

        if (event.identifier === NftEventEnum.ESDTNFTBurn) {
          nftsToDelete.push(nft.identifier);
        }
      }
    }

    collectionsToUpdate = [...new Set(collectionsToUpdate)];

    const deletes: Promise<DeleteResult>[] = nftsToDelete.map((n) => {
      return this.nftRarityService.deleteNftRarity(n);
    });

    await Promise.all([
      deletes,
      this.rarityUpdater.addCollectionsToRarityQueue(collectionsToUpdate),
    ]);
  }
}

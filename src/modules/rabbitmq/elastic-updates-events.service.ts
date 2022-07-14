import { Injectable } from '@nestjs/common';
import { RedisCacheService } from 'src/common';
import { DeleteResult } from 'typeorm/query-builder/result/DeleteResult';
import { NftEventEnum } from '../assets/models/AuctionEvent.enum';
import { NftTypeEnum } from '../assets/models/NftTypes.enum';
import { NftRarityService } from '../nft-rarity/nft-rarity.service';
import { FlagNftService } from '../admins/flag-nft.service';
import { MintEvent } from './entities/auction/mint.event';
import * as Redis from 'ioredis';
import { cacheConfig } from 'src/config';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { AssetByIdentifierService } from '../assets/asset-by-identifier.service';

@Injectable()
export class ElasticUpdatesEventsService {
  private readonly redisClient: Redis.Redis;
  constructor(
    private readonly nftFlagsService: FlagNftService,
    private readonly assetsGetterService: AssetByIdentifierService,
    private readonly nftRarityService: NftRarityService,
    private readonly redisCacheService: RedisCacheService,
  ) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.rarityQueueClientName,
    );
  }
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
      const nft = await this.assetsGetterService.getAsset(identifier);

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
      this.addCollectionsToRarityQueue(collectionsToUpdate),
    ]);
  }

  async addCollectionsToRarityQueue(
    collectionTickers: string[],
  ): Promise<void> {
    if (collectionTickers?.length > 0) {
      await this.redisCacheService.addItemsToList(
        this.redisClient,
        this.getRarityQueueCacheKey(),
        collectionTickers,
      );
    }
  }

  private getRarityQueueCacheKey() {
    return generateCacheKeyFromParams(cacheConfig.rarityQueueClientName);
  }
}

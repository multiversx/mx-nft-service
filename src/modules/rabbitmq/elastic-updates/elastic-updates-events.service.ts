import { Injectable } from '@nestjs/common';
import { RedisCacheService } from 'src/common';
import { cacheConfig } from 'src/config';
import { FlagNftService } from 'src/modules/admins/flag-nft.service';
import { AssetByIdentifierService } from 'src/modules/assets';
import { NftEventEnum, NftTypeEnum } from 'src/modules/assets/models';
import { NftRarityService } from 'src/modules/nft-rarity/nft-rarity.service';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { MintEvent } from '../entities/auction/mint.event';
import * as Redis from 'ioredis';

@Injectable()
export class ElasticUpdatesEventsService {
  private readonly rarityRedisClient: Redis.Redis;
  private readonly traitsRedisClient: Redis.Redis;

  constructor(
    private readonly nftFlagsService: FlagNftService,
    private readonly assetByIdentifierService: AssetByIdentifierService,
    private readonly nftRarityService: NftRarityService,
    private readonly redisCacheService: RedisCacheService,
  ) {
    this.rarityRedisClient = this.redisCacheService.getClient(
      cacheConfig.rarityQueueClientName,
    );
    this.traitsRedisClient = this.redisCacheService.getClient(
      cacheConfig.traitsQueueClientName,
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

  public async handleTraitsForNftMintBurnAndUpdateEvents(
    mintEvents: any[],
  ): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    let nftsToUpdate: string[] = [];

    for (let event of mintEvents) {
      const mintEvent = new MintEvent(event);
      const createTopics = mintEvent.getTopics();
      const identifier = `${createTopics.collection}-${createTopics.nonce}`;
      const nft = await this.assetByIdentifierService.getAsset(identifier);

      if (!nft || Object.keys(nft).length === 0) {
        return;
      }

      if (
        nft.type === NftTypeEnum.NonFungibleESDT ||
        nft.type === NftTypeEnum.SemiFungibleESDT
      ) {
        nftsToUpdate.push(nft.identifier);
      }
    }

    nftsToUpdate = [...new Set(nftsToUpdate)];

    await this.addNftsToTraitsQueue(nftsToUpdate);
  }

  public async handleRaritiesForNftMintBurnAndUpdateEvents(
    mintEvents: any[],
  ): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 5000));

    let collectionsToUpdate: string[] = [];
    let nftsToDelete: string[] = [];

    for (let event of mintEvents) {
      const mintEvent = new MintEvent(event);
      const createTopics = mintEvent.getTopics();
      const identifier = `${createTopics.collection}-${createTopics.nonce}`;
      const nft = await this.assetByIdentifierService.getAsset(identifier);

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

    const deletes: Promise<any>[] = nftsToDelete.map((n) => {
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
        this.rarityRedisClient,
        this.getRarityQueueCacheKey(),
        collectionTickers,
      );
    }
  }

  private getRarityQueueCacheKey() {
    return generateCacheKeyFromParams(cacheConfig.rarityQueueClientName);
  }

  async addNftsToTraitsQueue(collectionTickers: string[]): Promise<void> {
    if (collectionTickers?.length > 0) {
      await this.redisCacheService.addItemsToList(
        this.traitsRedisClient,
        this.getTraitsQueueCacheKey(),
        collectionTickers,
      );
    }
  }

  private getTraitsQueueCacheKey() {
    return generateCacheKeyFromParams(cacheConfig.traitsQueueClientName);
  }
}

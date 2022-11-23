import { Injectable } from '@nestjs/common';
import { ElrondApiService, RedisCacheService } from 'src/common';
import { cacheConfig } from 'src/config';
import { FlagNftService } from 'src/modules/admins/flag-nft.service';
import { AssetByIdentifierService } from 'src/modules/assets';
import { NftEventEnum, NftTypeEnum } from 'src/modules/assets/models';
import { NftRarityService } from 'src/modules/nft-rarity/nft-rarity.service';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { MintEvent } from '../entities/auction/mint.event';
import * as Redis from 'ioredis';
import { BurnEvent } from '../entities/auction/burn.event';
import { UpdateAttributesEvent } from '../entities/auction/update-attributes.event';
import { NftScamService } from 'src/modules/nft-scam/nft-scam.service';
import { DocumentDbService } from 'src/document-db/document-db.service';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';

@Injectable()
export class ElasticUpdatesEventsService {
  private readonly rarityRedisClient: Redis.Redis;
  private readonly traitsRedisClient: Redis.Redis;
  private redisClient: Redis.Redis;

  constructor(
    private readonly nftFlagsService: FlagNftService,
    private readonly assetByIdentifierService: AssetByIdentifierService,
    private readonly nftRarityService: NftRarityService,
    private readonly nftScamInfoService: NftScamService,
    private readonly documentDbService: DocumentDbService,
    private readonly redisCacheService: RedisCacheService,
    private readonly elrondApiService: ElrondApiService,
  ) {
    this.rarityRedisClient = this.redisCacheService.getClient(
      cacheConfig.rarityQueueClientName,
    );
    this.traitsRedisClient = this.redisCacheService.getClient(
      cacheConfig.traitsQueueClientName,
    );
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.persistentRedisClientName,
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
    events: any[],
  ): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 6000));
    let nftsOrCollectionsToUpdate: string[] = [];
    let collectionTypes: { [key: string]: string } = {};

    for (let event of events) {
      event = this.convertToMatchingEventType(event);

      const topics = event.getTopics();
      const collection = topics.collection;
      const identifier = `${collection}-${topics.nonce}`;

      if (event.identifier === NftEventEnum.ESDTNFTBurn) {
        if (!collectionTypes[collection]) {
          collectionTypes[collection] = await this.getCollectionType(
            collection,
          );
        }
        if (
          collectionTypes[collection] === NftTypeEnum.NonFungibleESDT ||
          collectionTypes[collection] === NftTypeEnum.SemiFungibleESDT
        ) {
          nftsOrCollectionsToUpdate.push(topics.collection);
        }
        continue;
      }

      const nft = await this.assetByIdentifierService.getAsset(identifier);
      collectionTypes[collection] = nft.type;

      if (!nft || Object.keys(nft).length === 0) {
        continue;
      }

      if (
        nft.type === NftTypeEnum.NonFungibleESDT ||
        nft.type === NftTypeEnum.SemiFungibleESDT
      ) {
        nftsOrCollectionsToUpdate.push(identifier);
      }
    }

    nftsOrCollectionsToUpdate = [...new Set(nftsOrCollectionsToUpdate)];

    await this.addNftsToTraitsQueue(nftsOrCollectionsToUpdate);
  }

  public async handleRaritiesForNftMintBurnAndUpdateEvents(
    mintEvents: any[],
  ): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 6000));

    let collectionsToUpdate: string[] = [];
    let nftsToDelete: string[] = [];
    let collectionTypes: { [key: string]: string } = {};

    for (let event of mintEvents) {
      const mintEvent = new MintEvent(event);
      const createTopics = mintEvent.getTopics();
      const collection = createTopics.collection;
      const identifier = `${collection}-${createTopics.nonce}`;

      if (event.identifier === NftEventEnum.ESDTNFTBurn) {
        if (!collectionTypes[collection]) {
          collectionTypes[collection] = await this.getCollectionType(
            collection,
          );
        }
        if (
          collectionTypes[collection] === NftTypeEnum.NonFungibleESDT ||
          collectionTypes[collection] === NftTypeEnum.SemiFungibleESDT
        ) {
          nftsToDelete.push(identifier);
          collectionsToUpdate.push(collection);
        }
        continue;
      }

      const nft = await this.assetByIdentifierService.getAsset(identifier);
      collectionTypes[collection] = nft.type;

      if (!nft || Object.keys(nft).length === 0) {
        continue;
      }

      if (
        nft.type === NftTypeEnum.NonFungibleESDT ||
        nft.type === NftTypeEnum.SemiFungibleESDT
      ) {
        collectionsToUpdate.push(nft.collection);
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

  public async handleScamInfoForNftMintBurnAndUpdateEvents(
    mintEvents: any[],
  ): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 5000));

    let nftsToUpdate: string[] = [];
    let nftsToDelete: string[] = [];
    let collectionTypes: { [key: string]: string } = {};

    for (let event of mintEvents) {
      const mintEvent = new MintEvent(event);
      const createTopics = mintEvent.getTopics();
      const collection = createTopics.collection;
      const identifier = `${collection}-${createTopics.nonce}`;

      if (event.identifier === NftEventEnum.ESDTNFTBurn) {
        if (!collectionTypes[collection]) {
          collectionTypes[collection] = await this.getCollectionType(
            collection,
          );
        }
        if (
          collectionTypes[collection] === NftTypeEnum.NonFungibleESDT ||
          collectionTypes[collection] === NftTypeEnum.SemiFungibleESDT
        ) {
          nftsToDelete.push(identifier);
        }
        continue;
      }

      const nft = await this.assetByIdentifierService.getAsset(identifier);
      collectionTypes[collection] = nft.type;

      if (!nft || Object.keys(nft).length === 0) {
        continue;
      }

      if (
        nft.type === NftTypeEnum.NonFungibleESDT ||
        nft.type === NftTypeEnum.SemiFungibleESDT
      ) {
        nftsToUpdate.push(nft.identifier);
      }
    }

    nftsToUpdate = [...new Set(nftsToUpdate)];

    const deletes: Promise<any>[] = nftsToDelete.map((n) => {
      return this.documentDbService.deleteNftScamInfo(n);
    });

    nftsToUpdate.map(
      async (collection) =>
        await this.nftScamInfoService.validateOrUpdateNftScamInfo(collection),
    );

    await Promise.all(deletes);
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

  private convertToMatchingEventType(
    event: any,
  ): MintEvent | UpdateAttributesEvent | BurnEvent {
    switch (event.identifier) {
      case NftEventEnum.ESDTNFTCreate: {
        event = new MintEvent(event);
      }
      case NftEventEnum.ESDTNFTUpdateAttributes: {
        event = new UpdateAttributesEvent(event);
      }
      case NftEventEnum.ESDTNFTBurn: {
        event = new BurnEvent(event);
      }
    }
    return event;
  }

  public async getCollectionType(ticker: string): Promise<string> {
    const cacheKey = this.getCollectionTypeCacheKey(ticker);
    const getCollectionType = () =>
      this.elrondApiService.getCollectionType(ticker);
    const collectionType = await this.redisCacheService.getOrSet(
      this.redisClient,
      cacheKey,
      getCollectionType,
      CacheInfo.CollectionTypes.ttl,
    );
    return collectionType;
  }

  private getCollectionTypeCacheKey(ticker: string) {
    return generateCacheKeyFromParams(CacheInfo.CollectionTypes.key, ticker);
  }
}

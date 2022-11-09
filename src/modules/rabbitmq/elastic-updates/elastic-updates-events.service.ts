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
import { BurnEvent } from '../entities/auction/burn.event';
import { UpdateAttributesEvent } from '../entities/auction/update-attributes.event';
import { NftScamService } from 'src/modules/nft-scam/nft-scam.service';
import { PersistenceService } from 'src/common/persistence/persistence.service';

@Injectable()
export class ElasticUpdatesEventsService {
  private readonly rarityRedisClient: Redis.Redis;
  private readonly traitsRedisClient: Redis.Redis;

  constructor(
    private readonly nftFlagsService: FlagNftService,
    private readonly assetByIdentifierService: AssetByIdentifierService,
    private readonly nftRarityService: NftRarityService,
    private readonly nftScamInfoService: NftScamService,
    private readonly persistenceService: PersistenceService,
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
    events: any[],
  ): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    let nftsOrCollectionsToUpdate: string[] = [];

    for (let event of events) {
      event = this.convertToMatchingEventType(event);

      const topics = event.getTopics();
      const identifier = `${topics.collection}-${topics.nonce}`;

      if (event.identifier === NftEventEnum.ESDTNFTBurn) {
        nftsOrCollectionsToUpdate.push(topics.collection);
        continue;
      }

      const nft = await this.assetByIdentifierService.getAsset(identifier);

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
    await new Promise((resolve) => setTimeout(resolve, 5000));

    let collectionsToUpdate: string[] = [];
    let nftsToDelete: string[] = [];

    for (let event of mintEvents) {
      const mintEvent = new MintEvent(event);
      const createTopics = mintEvent.getTopics();
      const identifier = `${createTopics.collection}-${createTopics.nonce}`;
      const nft = await this.assetByIdentifierService.getAsset(identifier);

      if (!nft || Object.keys(nft).length === 0) {
        continue;
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

  public async handleScamInfoForNftMintBurnAndUpdateEvents(
    mintEvents: any[],
  ): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 5000));

    let nftsToUpdate: string[] = [];
    let nftsToDelete: string[] = [];

    for (let event of mintEvents) {
      const mintEvent = new MintEvent(event);
      const createTopics = mintEvent.getTopics();
      const identifier = `${createTopics.collection}-${createTopics.nonce}`;
      const nft = await this.assetByIdentifierService.getAsset(identifier);

      if (!nft || Object.keys(nft).length === 0) {
        continue;
      }

      if (
        nft.type === NftTypeEnum.NonFungibleESDT ||
        nft.type === NftTypeEnum.SemiFungibleESDT
      ) {
        if (event.identifier === NftEventEnum.ESDTNFTBurn) {
          nftsToDelete.push(nft.identifier);
        } else {
          nftsToUpdate.push(nft.identifier);
        }
      }
    }

    nftsToUpdate = [...new Set(nftsToUpdate)];

    const deletes: Promise<any>[] = nftsToDelete.map((n) => {
      return this.persistenceService.deleteNftScamInfo(n);
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
}

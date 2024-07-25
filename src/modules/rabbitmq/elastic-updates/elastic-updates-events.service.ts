import { Injectable } from '@nestjs/common';
import { MxApiService } from 'src/common';
import { FlagNftService } from 'src/modules/admins/flag-nft.service';
import { AssetByIdentifierService } from 'src/modules/assets';
import { Asset, NftEventEnum, NftTypeEnum } from 'src/modules/assets/models';
import { NftRarityService } from 'src/modules/nft-rarity/nft-rarity.service';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { MintEvent } from '../entities/auction/mint.event';
import { BurnEvent } from '../entities/auction/burn.event';
import { UpdateAttributesEvent } from '../entities/auction/update-attributes.event';
import { NftScamService } from 'src/modules/scam/nft-scam.service';
import { DocumentDbService } from 'src/document-db/document-db.service';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { RedisCacheService } from '@multiversx/sdk-nestjs-cache';

@Injectable()
export class ElasticUpdatesEventsService {
  constructor(
    private readonly nftFlagsService: FlagNftService,
    private readonly assetByIdentifierService: AssetByIdentifierService,
    private readonly nftRarityService: NftRarityService,
    private readonly nftScamInfoService: NftScamService,
    private readonly documentDbService: DocumentDbService,
    private readonly redisCacheService: RedisCacheService,
    private readonly mxApiService: MxApiService,
  ) { }

  public async handleNftMintEvents(mintEvents: any[], hash: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    for (let event of mintEvents) {
      switch (event.identifier) {
        case NftEventEnum.ESDTNFTCreate:
          const mintEvent = new MintEvent(event);
          const createTopics = mintEvent.getTopics();
          const collection = await this.mxApiService.getCollectionByIdentifierForQuery(createTopics.collection, 'fields=name,type');
          if (collection?.type === NftTypeEnum.NonFungibleESDT || collection?.type === NftTypeEnum.SemiFungibleESDT) {
            const identifier = `${createTopics.collection}-${createTopics.nonce}`;
            await this.nftFlagsService.updateNftFlag(identifier);
          }
          break;
      }
    }
  }

  public async handleTraitsForNftMintBurnAndUpdateEvents(events: any[]): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 6000));
    let nftsOrCollectionsToUpdate: string[] = [];
    let collectionTypes: { [key: string]: string } = {};

    for (let event of events) {
      event = this.convertToMatchingEventType(event);

      const topics = event.getTopics();
      const collection = topics.collection;

      if (await this.isCollectionOfNftsOrSfts(collection, collectionTypes)) {
        const identifier = `${collection}-${topics.nonce}`;
        nftsOrCollectionsToUpdate.push(identifier);
      }
    }

    nftsOrCollectionsToUpdate = [...new Set(nftsOrCollectionsToUpdate)];

    await this.addNftsToTraitsQueue(nftsOrCollectionsToUpdate);
  }

  public async handleRaritiesForNftMintBurnAndUpdateEvents(mintEvents: any[]): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 6000));

    let collectionsToUpdate: string[] = [];
    let nftsToDelete: string[] = [];
    let collectionTypes: { [key: string]: string } = {};

    for (let event of mintEvents) {
      const mintEvent = new MintEvent(event);
      const createTopics = mintEvent.getTopics();
      const collection = createTopics.collection;

      if (!(await this.isCollectionOfNftsOrSfts(collection, collectionTypes))) {
        continue;
      }

      const identifier = `${collection}-${createTopics.nonce}`;
      let nft: Asset;

      if (event.identifier === NftEventEnum.ESDTNFTBurn) {
        if (await this.isNftOrNoMoreSftQuantity(collection, identifier, collectionTypes)) {
          nftsToDelete.push(identifier);
        }
        collectionsToUpdate.push(collection);
        continue;
      }

      nft = await this.assetByIdentifierService.getAsset(identifier);

      if (!nft || Object.keys(nft).length === 0) {
        continue;
      }

      collectionTypes[collection] = nft.type;
      collectionsToUpdate.push(collection);
    }

    collectionsToUpdate = [...new Set(collectionsToUpdate)];

    const deletes: Promise<any>[] = nftsToDelete.map((n) => {
      return this.nftRarityService.deleteNftRarity(n);
    });

    await Promise.all([deletes, this.addCollectionsToRarityQueue(collectionsToUpdate)]);
  }

  public async handleScamInfoForNftMintBurnAndUpdateEvents(mintEvents: any[]): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 10000));

    let nftsToUpdate: Asset[] = [];
    let nftsToDelete: string[] = [];
    let collectionTypes: { [key: string]: string } = {};

    for (let event of mintEvents) {
      const mintEvent = new MintEvent(event);
      const createTopics = mintEvent.getTopics();
      const collection = createTopics.collection;

      if (!(await this.isCollectionOfNftsOrSfts(collection, collectionTypes))) {
        continue;
      }

      const identifier = `${collection}-${createTopics.nonce}`;
      let nft: Asset;

      if (event.identifier === NftEventEnum.ESDTNFTBurn) {
        if (await this.isNftOrNoMoreSftQuantity(collection, identifier, collectionTypes)) {
          nftsToDelete.push(identifier);
        }
        continue;
      }

      nft = await this.assetByIdentifierService.getAsset(identifier);

      if (!nft || Object.keys(nft).length === 0) {
        continue;
      }

      collectionTypes[collection] = nft.type;
      nftsToUpdate.push(nft);
    }

    nftsToUpdate = [...new Set(nftsToUpdate)];

    const deletes: Promise<any>[] = nftsToDelete.map((n) => {
      return this.documentDbService.deleteNftScamInfo(n);
    });

    await this.nftScamInfoService.validateNftsScamInfoArray(nftsToUpdate);

    await Promise.all(deletes);
  }

  private async addCollectionsToRarityQueue(collectionTickers: string[]): Promise<void> {
    if (collectionTickers?.length > 0) {
      await this.redisCacheService.rpush(this.getRarityQueueCacheKey(), collectionTickers);
    }
  }

  private getRarityQueueCacheKey() {
    return generateCacheKeyFromParams('rarityQueue');
  }

  async addNftsToTraitsQueue(collectionTickers: string[]): Promise<void> {
    if (collectionTickers?.length > 0) {
      await this.redisCacheService.rpush(this.getTraitsQueueCacheKey(), collectionTickers);
    }
  }

  private getTraitsQueueCacheKey() {
    return generateCacheKeyFromParams('traitsQueue');
  }

  private convertToMatchingEventType(event: any): MintEvent | UpdateAttributesEvent | BurnEvent {
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

  private async getCollectionType(ticker: string): Promise<string> {
    const cacheKey = this.getCollectionTypeCacheKey(ticker);
    const collectionType = await this.redisCacheService.getOrSet<string>(
      cacheKey,
      () => this.getCollectionTypeFromApi(ticker),
      CacheInfo.CollectionTypes.ttl,
    );
    return collectionType;
  }

  private async getCollectionTypeFromApi(ticker: string): Promise<string> {
    const collection = await this.mxApiService.getCollectionByIdentifierForQuery(ticker, 'fields=type');
    return collection.type;
  }

  private async isCollectionOfNftsOrSfts(collection: string, collectionTypes: { [key: string]: string }): Promise<boolean> {
    if (!collectionTypes[collection]) {
      collectionTypes[collection] = await this.getCollectionType(collection);
    }
    if (collectionTypes[collection] === NftTypeEnum.NonFungibleESDT || collectionTypes[collection] === NftTypeEnum.SemiFungibleESDT) {
      return true;
    }
    return false;
  }

  private async isCollectionOfNfts(collection: string, collectionTypes: { [key: string]: string }): Promise<boolean> {
    if (!collectionTypes[collection]) {
      collectionTypes[collection] = await this.getCollectionType(collection);
    }
    if (collectionTypes[collection] === NftTypeEnum.NonFungibleESDT) {
      return true;
    }
    return false;
  }

  private async isNftOrNoMoreSftQuantity(
    collection: string,
    identifier: string,
    collectionTypes: { [key: string]: string },
  ): Promise<boolean> {
    if (await this.isCollectionOfNfts(collection, collectionTypes)) {
      return true;
    } else {
      const nft = await this.assetByIdentifierService.getAsset(identifier);
      if (!nft) {
        return true;
      }
    }
    return false;
  }

  private getCollectionTypeCacheKey(ticker: string) {
    return generateCacheKeyFromParams(CacheInfo.CollectionTypes.key, ticker);
  }
}

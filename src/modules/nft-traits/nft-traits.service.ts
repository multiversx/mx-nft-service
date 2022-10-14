import {
  ElasticQuery,
  QueryType,
  QueryOperator,
  RangeLowerThanOrEqual,
  RangeGreaterThan,
  ElasticSortOrder,
} from '@elrondnetwork/erdnest';
import { Injectable, Logger } from '@nestjs/common';
import { ElrondApiService, ElrondElasticService, Nft } from 'src/common';
import { NftTypeEnum } from '../assets/models';
import { CollectionTraitSummary } from './models/collection-traits.model';
import {
  NftTrait,
  EncodedNftValues,
  NftTraits,
} from './models/nft-traits.model';
import { getCollectionAndNonceFromIdentifier } from 'src/utils/helpers';
import { AssetsQuery } from '../assets';
import { constants } from 'src/config';
import { Locker } from 'src/utils/locker';
import { PersistenceService } from 'src/common/persistence/persistence.service';

@Injectable()
export class NftTraitsService {
  constructor(
    private readonly apiService: ElrondApiService,
    private readonly elasticService: ElrondElasticService,
    private readonly persistenceService: PersistenceService,
    private readonly logger: Logger,
  ) {}

  async updateCollectionTraits(collectionTicker: string): Promise<boolean> {
    try {
      const [collectionTraitSummaryFromDb, nftsCount]: [
        CollectionTraitSummary,
        number,
      ] = await Promise.all([
        this.getCollectionTraitSummaryFromDb(collectionTicker),
        this.apiService.getCollectionNftsCount(collectionTicker),
      ]);

      if (this.isCollectionTooBig(collectionTicker, nftsCount)) {
        await this.persistenceService.updateTraitSummaryLastUpdated(
          collectionTicker,
        );
        await this.setCollectionTraitsFlagInElastic(collectionTicker);
        return false;
      }

      const [collectionTraitSummary, notIdenticalNftsCount] =
        await this.getTraitSummaryAndUpdateNotIdenticalNfts(
          collectionTicker,
          nftsCount,
        );

      const areCollectionSummariesIdentical =
        collectionTraitSummary.isIdenticalTo(collectionTraitSummaryFromDb);

      if (notIdenticalNftsCount === 0 && areCollectionSummariesIdentical) {
        this.logger.log(`${collectionTicker} - VALID`, {
          path: `${NftTraitsService.name}.${this.updateCollectionTraits.name}`,
        });
        await this.persistenceService.updateTraitSummaryLastUpdated(
          collectionTicker,
        );
        await this.setCollectionTraitsFlagInElastic(collectionTicker);
        return false;
      }

      if (!areCollectionSummariesIdentical || !collectionTraitSummaryFromDb) {
        await this.persistenceService.saveOrUpdateTraitSummary(
          collectionTraitSummary,
        );
        await this.setCollectionTraitsFlagInElastic(collectionTicker);
        this.logger.log(
          `${collectionTicker} - Updated collection trait summary`,
          {
            path: `${NftTraitsService.name}.${this.updateCollectionTraits.name}`,
          },
        );
        return true;
      }

      return false;
    } catch (error) {
      this.logger.log(
        `Error when trying to update/validate collection traits for ${collectionTicker}`,
        {
          path: `${NftTraitsService.name}.${this.updateCollectionTraits.name}`,
          error: error.message,
        },
      );
      return false;
    }
  }

  private async getTraitSummaryAndUpdateNotIdenticalNfts(
    collection: string,
    nftsCount: number,
  ): Promise<[CollectionTraitSummary, number]> {
    const batchSize = Math.min(
      constants.getNftsFromApiBatchSize,
      constants.getNftsFromElasticBatchSize,
    );

    let lastNonce: number = 0;
    let notIdenticalNftsCount: number = 0;
    let collectionTraitSummary: CollectionTraitSummary =
      new CollectionTraitSummary({
        identifier: collection,
        traitTypes: {},
      });

    do {
      const [nftsFromApi, encodedNftValuesFromElastic]: [
        NftTraits[],
        EncodedNftValues[],
      ] = await Promise.all([
        this.getAllCollectionNftsFromAPI(
          collection,
          lastNonce,
          lastNonce + batchSize,
        ),
        this.getAllEncodedNftValuesFromElastic(
          collection,
          lastNonce,
          lastNonce + batchSize,
        ),
      ]);

      if (nftsFromApi.length !== encodedNftValuesFromElastic.length) {
        const message =
          nftsFromApi.length > encodedNftValuesFromElastic.length
            ? 'Missing NFTs from Elastic'
            : 'Extra NFTs in Elastic';
        this.logger.log(
          `${collection} - ${message} ${nftsFromApi.length} vs ${encodedNftValuesFromElastic.length}`,
          {
            path: `${NftTraitsService.name}.${this.updateCollectionTraits.name}`,
            collection: collection,
            nftsInApi: nftsFromApi.length,
            nftsInElastic: encodedNftValuesFromElastic.length,
          },
        );
      }

      const updateNotIdenticalNftsPromise = this.updateNotIdenticalNfts(
        nftsFromApi,
        encodedNftValuesFromElastic,
      );

      for (const nft of nftsFromApi) {
        collectionTraitSummary.addNftTraitsToCollection(nft.traits);
      }

      notIdenticalNftsCount += await updateNotIdenticalNftsPromise;

      lastNonce += batchSize;
    } while (lastNonce < nftsCount);

    if (notIdenticalNftsCount > 0) {
      this.logger.log(
        `${collection} - Updated ${notIdenticalNftsCount}/${lastNonce} NFTs`,
        {
          path: `${NftTraitsService.name}.${this.updateCollectionTraits.name}`,
        },
      );
    }

    return [collectionTraitSummary, notIdenticalNftsCount];
  }

  private async updateNotIdenticalNfts(
    nftsFromApi: NftTraits[],
    encodedNftValuesFromElastic: EncodedNftValues[],
  ): Promise<number> {
    const notIdenticalEncodedValues: EncodedNftValues[] =
      this.getNotIdenticalNftValues(nftsFromApi, encodedNftValuesFromElastic);
    await this.setNftsValuesInElastic(notIdenticalEncodedValues);
    return notIdenticalEncodedValues.length;
  }

  async updateAllCollectionTraits(): Promise<void> {
    await Locker.lock(
      'updateAllCollectionTraits: Update traits for all existing collections',
      async () => {
        const query = this.getAllCollectionsFromElasticQuery();

        try {
          let collections: string[] = [];

          await this.elasticService.getScrollableList(
            'tokens',
            'token',
            query,
            async (items) => {
              collections = collections.concat([
                ...new Set(items.map((i) => i.token)),
              ]);
            },
          );

          this.logger.log(
            `Total collections to be validated - ${collections.length}`,
          );

          for (const collection of collections) {
            await this.updateCollectionTraits(collection);
          }
        } catch (error) {
          this.logger.error('Error when updating all collections', {
            path: `${NftTraitsService.name}.${this.updateAllCollectionTraits.name}`,
            exception: error?.message,
          });
        }
      },
      true,
    );
  }

  async updateNftTraits(identifier: string): Promise<boolean> {
    const { collection } = getCollectionAndNonceFromIdentifier(identifier);
    let [nftTraitsFromApi, nftTraitValuesFromElastic, nftsCount] =
      await Promise.all([
        this.getCollectionNftMetadataFromAPI(identifier),
        this.getNftValuesFromElastic(identifier),
        this.apiService.getCollectionNftsCount(collection),
      ]);

    if (this.isCollectionTooBig(collection, nftsCount)) {
      await this.persistenceService.updateTraitSummaryLastUpdated(collection);
      await this.setCollectionTraitsFlagInElastic(collection);
      return false;
    }

    const areIdenticalTraits = this.areIdenticalTraits(
      nftTraitsFromApi.traits,
      nftTraitValuesFromElastic,
    );

    if (!nftTraitValuesFromElastic) {
      this.logger.warn(`NFT ${identifier} not found in Elastic`, {
        path: `${NftTraitsService.name}.${this.updateNftTraits.name}`,
        identifier: identifier,
      });
    }

    if (nftTraitsFromApi && !areIdenticalTraits) {
      this.logger.log(`${identifier} - MINT/UPDATE`, {
        path: `${NftTraitsService.name}.${this.updateNftTraits.name}`,
      });
      const traitSummaryFromDb: CollectionTraitSummary =
        await this.getCollectionTraitSummaryFromDb(collection);
      return await this.mintCollectionNft(
        new CollectionTraitSummary({
          identifier: collection,
          traitTypes: traitSummaryFromDb?.traitTypes ?? {},
        }),
        nftTraitsFromApi,
      );
    } else if (
      nftTraitsFromApi &&
      nftTraitValuesFromElastic &&
      !areIdenticalTraits
    ) {
      this.logger.log(
        `${identifier} - Unknown missmatch cause => update collection trait summary`,
        {
          path: `${NftTraitsService.name}.${this.updateNftTraits.name}`,
          identifier: identifier,
        },
      );
      return await this.updateCollectionTraits(collection);
    }

    this.logger.log(`${identifier} - VALID`, {
      path: `${NftTraitsService.name}.${this.updateNftTraits.name}`,
    });

    return false;
  }

  async mintCollectionNft(
    traitSummaryFromElastic: CollectionTraitSummary,
    nftTraitsFromApi: NftTraits,
  ): Promise<boolean> {
    traitSummaryFromElastic = new CollectionTraitSummary(
      traitSummaryFromElastic,
    ).addNftTraitsToCollection(nftTraitsFromApi.traits);
    await Promise.all([
      this.setNftsTraitsInElastic([nftTraitsFromApi]),
      this.persistenceService.saveOrUpdateTraitSummary(traitSummaryFromElastic),
    ]);
    return true;
  }

  async getNftsByTraits(
    collection: string,
    traits: NftTrait[],
    limit: number,
    offset: number,
  ): Promise<[Nft[], number]> {
    return await this.apiService.getNftsAndCount(
      new AssetsQuery()
        .addCollection(collection)
        .addTraits(traits)
        .addPageSize(offset, limit)
        .build(),
      new AssetsQuery().addCollection(collection).addTraits(traits).build(),
    );
  }

  private areIdenticalTraits(
    traits: NftTrait[],
    traitValues: string[],
  ): boolean {
    if (traits?.length !== traitValues?.length) {
      return false;
    }
    for (const trait of traits) {
      if (!traitValues?.includes(EncodedNftValues.encode(trait))) {
        return false;
      }
    }
    return true;
  }

  private getNotIdenticalNftValues(
    nftsFromApi: NftTraits[],
    encodedNftValuesFromElastic: EncodedNftValues[],
  ): EncodedNftValues[] {
    let notIdenticalEncodedValues: EncodedNftValues[] = [];

    for (const nft of nftsFromApi) {
      const correspondingEncodedNftValues = encodedNftValuesFromElastic?.find(
        (encodedNft) => encodedNft.identifier === nft.identifier,
      );

      const [areIdentical, nftEncodedValues] = nft.isIdenticalTo(
        correspondingEncodedNftValues,
      );

      if (!areIdentical) {
        notIdenticalEncodedValues.push(nftEncodedValues);
      }
    }

    return notIdenticalEncodedValues;
  }

  private buildNftTraitsBulkUpdate(nfts: NftTraits[]): string[] {
    let updates: string[] = [];
    nfts.forEach((nft) => {
      const payload = this.elasticService.buildBulkUpdate<string[]>(
        'tokens',
        nft.identifier,
        'nft_traitValues',
        nft.traits.map((t) => EncodedNftValues.encode(t)),
      );
      updates.push(payload);
    });
    return updates;
  }

  private buildNftEncodedValuesBulkUpdate(
    encodedNftValues: EncodedNftValues[],
  ): string[] {
    let updates: string[] = [];
    encodedNftValues.forEach((nft) => {
      const payload = this.elasticService.buildBulkUpdate<string[]>(
        'tokens',
        nft.identifier,
        'nft_traitValues',
        nft.encodedValues ?? [],
      );
      updates.push(payload);
    });
    return updates;
  }

  private async setNftsTraitsInElastic(nfts: NftTraits[]): Promise<void> {
    if (nfts.length > 0) {
      try {
        await this.elasticService.bulkRequest(
          'tokens',
          this.buildNftTraitsBulkUpdate(nfts),
          '?timeout=1m',
        );
      } catch (error) {
        this.logger.error('Error when bulk updating nft traits in Elastic', {
          path: `${NftTraitsService.name}.${this.setNftsTraitsInElastic.name}`,
          exception: error?.message,
        });
      }
    }
  }

  private async setNftsValuesInElastic(
    encodedNftValues: EncodedNftValues[],
  ): Promise<void> {
    if (encodedNftValues.length > 0) {
      try {
        await this.elasticService.bulkRequest(
          'tokens',
          this.buildNftEncodedValuesBulkUpdate(encodedNftValues),
          '?timeout=1m',
        );
      } catch (error) {
        this.logger.error('Error when bulk updating nft traits in Elastic', {
          path: `${NftTraitsService.name}.${this.setNftsValuesInElastic.name}`,
          exception: error?.message,
        });
      }
    }
  }

  private async getAllCollectionNftsFromAPI(
    collectionTicker: string,
    startNonce?: number,
    endNonce?: number,
  ): Promise<NftTraits[]> {
    try {
      const res = await this.apiService.getAllNftsByCollectionAfterNonce(
        collectionTicker,
        'identifier,nonce,timestamp,metadata',
        startNonce,
        endNonce,
      );
      return res?.map(NftTraits.fromNft) ?? [];
    } catch (error) {
      this.logger.error(`Error when getting all collection NFTs from API`, {
        path: `${NftTraitsService.name}.${this.getAllCollectionNftsFromAPI.name}`,
        exception: error?.message,
        collection: collectionTicker,
      });
    }
  }

  private async getCollectionNftMetadataFromAPI(
    identifier: string,
  ): Promise<NftTraits> {
    try {
      const metadata = await this.apiService.getNftMetadataByIdentifierForQuery(
        identifier,
        'withOwner=true&withSupply=true&extract=metadata',
      );
      return new NftTraits({
        identifier: identifier,
        traits: Array.isArray(metadata?.attributes)
          ? metadata?.attributes
              ?.filter((a) => a.trait_type && a.value)
              ?.map(NftTrait.fromNftMetadataAttribute)
          : [],
      });
    } catch (error) {
      this.logger.error(`Error when getting NFT from API`, {
        path: `${NftTraitsService.name}.${this.getCollectionNftMetadataFromAPI.name}`,
        exception: error?.message,
        identifier: identifier,
      });
    }
  }

  private async getCollectionTraitSummaryFromDb(
    collection: string,
  ): Promise<CollectionTraitSummary> {
    const collectionTraitSummary =
      await this.persistenceService.getTraitSummary(collection);
    return (
      collectionTraitSummary ??
      new CollectionTraitSummary({ identifier: collection, traitTypes: {} })
    );
  }

  private async getNftValuesFromElastic(identifier: string): Promise<string[]> {
    let nftValues: string[] = [];

    try {
      const query = this.getNftWithTraitValuesFromElasticQuery(identifier);

      await this.elasticService.getScrollableList(
        'tokens',
        'identifier',
        query,
        async (items) => {
          nftValues = items[0]?.nft_traitValues ?? [];
          return undefined;
        },
      );
    } catch (error) {
      this.logger.error(`Error when getting NFT trait values from Elastic`, {
        path: `${NftTraitsService.name}.${this.getNftValuesFromElastic.name}`,
        exception: error?.message,
        identifier: identifier,
      });
    }

    return nftValues;
  }

  private async getAllEncodedNftValuesFromElastic(
    collection: string,
    startNonce?: number,
    endNonce?: number,
  ): Promise<EncodedNftValues[]> {
    let encodedNftValues: EncodedNftValues[] = [];

    try {
      const query = this.getAllEncodedNftValuesFromElasticQuery(
        collection,
        startNonce,
        endNonce,
      );

      await this.elasticService.getScrollableList(
        'tokens',
        'identifier',
        query,
        async (items) => {
          encodedNftValues.push(
            ...new Set(
              items.map(
                (item) =>
                  new EncodedNftValues({
                    identifier: item.identifier,
                    encodedValues: item.nft_traitValues ?? [],
                  }),
              ),
            ),
          );
        },
      );
    } catch (error) {
      this.logger.error(
        `Error when getting all NFT trait values from Elastic`,
        {
          path: `${NftTraitsService.name}.${this.getAllEncodedNftValuesFromElastic.name}`,
          exception: error?.message,
          identifier: collection,
        },
      );
    }

    return encodedNftValues;
  }

  private async setCollectionTraitsFlagInElastic(
    collection: string,
  ): Promise<void> {
    try {
      let updates: string[] = [];
      updates.push(
        this.elasticService.buildBulkUpdate<boolean>(
          'tokens',
          collection,
          'nft_hasTraitSummary',
          true,
        ),
      );
      await this.elasticService.bulkRequest('tokens', updates, '?timeout=1m');
    } catch (error) {
      this.logger.error('Error when setting collection traits flag', {
        path: `${NftTraitsService.name}.${this.setCollectionTraitsFlagInElastic.name}`,
        exception: error?.message,
        collection: collection,
      });
    }
  }

  private isCollectionTooBig(collection: string, nftsCount: number): boolean {
    if (nftsCount > constants.nftsCountThresholdForTraitAndRarityIndexing) {
      this.logger.log(
        `${collection} - Collection NFTs count bigger than threshold`,
        {
          path: `${NftTraitsService.name}.${this.updateCollectionTraits.name}`,
          nftsCount: nftsCount,
        },
      );
      return true;
    }
  }

  async updateAllNftTraits(): Promise<void> {
    await Locker.lock(
      'updateAllNftTraits: Update traits for all existing NFTs',
      async () => {
        try {
          const batchSize = constants.updateAllNftTraitsBatchSize;
          let iterations = 0;
          let beforeTimestamp = Math.round(Date.now() / 1000);
          let totalProcessedNfts = 0;

          let collectionsNftsCountDict = {};

          while (true) {
            const [[nftsBatch, lastTimestamp], nftsFromElasticDict] =
              await Promise.all([
                this.apiService.getNftsWithAttributesBeforeTimestamp(
                  beforeTimestamp,
                  batchSize,
                ),
                this.getAllNftsWithTraitsFromElastic(
                  beforeTimestamp,
                  batchSize,
                ),
              ]);

            for (const nft of nftsBatch) {
              const { collection } = getCollectionAndNonceFromIdentifier(
                nft.identifier,
              );

              if (!collectionsNftsCountDict[nft.identifier]) {
                collectionsNftsCountDict[nft.identifier] =
                  await this.apiService.getCollectionNftsCount(collection);
              }

              if (
                this.isCollectionTooBig(
                  collection,
                  collectionsNftsCountDict[nft.identifier],
                )
              ) {
                totalProcessedNfts++;
                continue;
              }

              const nftTraitsFromApi = new NftTraits({
                identifier: nft.identifier,
                traits: Array.isArray(nft.metadata.attributes)
                  ? nft.metadata?.attributes
                      ?.filter((a) => a.trait_type && a.value)
                      ?.map(NftTrait.fromNftMetadataAttribute)
                  : [],
              });

              const areIdenticalTraits = this.areIdenticalTraits(
                nftTraitsFromApi.traits,
                nftsFromElasticDict[nft.identifier] ?? [],
              );

              if (!areIdenticalTraits) {
                const logMssage = nftsFromElasticDict[nft.identifier]
                  ? 'Not identical traits'
                  : 'Missing NFT from Elastic';
                this.logger.log(logMssage, {
                  path: `${NftTraitsService.name}.${this.updateAllNftTraits.name}`,
                  identifier: nft.identifier,
                });
                await this.updateNftTraits(nft.identifier);
                totalProcessedNfts++;
                continue;
              }

              this.logger.log(`${nft.identifier} - VALID`, {
                path: `${NftTraitsService.name}.${this.updateAllNftTraits.name}`,
              });
              totalProcessedNfts++;
            }

            if (lastTimestamp === beforeTimestamp) {
              this.logger.log(
                `Processed ${totalProcessedNfts} in ${iterations} iterations of ${batchSize} NFTs`,
                {
                  path: `${NftTraitsService.name}.${this.updateAllNftTraits.name}`,
                },
              );
              break;
            }

            iterations++;
            beforeTimestamp = lastTimestamp;
          }
        } catch (error) {
          this.logger.error('Error when updating all collections', {
            path: `${NftTraitsService.name}.${this.updateAllCollectionTraits.name}`,
            exception: error?.message,
          });
        }
      },
      true,
    );
  }

  private async getAllNftsWithTraitsFromElastic(
    beforeTimestamp: number,
    maxToFetch: number,
  ): Promise<{ [key: string]: string[] }> {
    let dict: { [key: string]: string[] } = {};
    try {
      const query =
        this.getAllEncodedNftValuesFromElasticBeforeTimestampQuery(
          beforeTimestamp,
        );

      await this.elasticService.getScrollableList(
        'tokens',
        'identifier',
        query,
        async (items) => {
          items.map((item) => (dict[item.identifier] = item.nft_traitValues));
        },
        maxToFetch,
      );
    } catch (error) {
      this.logger.error(
        `Error when getting all NFT trait values from Elastic`,
        {
          path: `${NftTraitsService.name}.${this.getAllNftsWithTraitsFromElastic.name}`,
          exception: error?.message,
        },
      );
    }
    return dict;
  }

  getAllEncodedNftValuesFromElasticQuery(
    collection: string,
    startNonce?: number,
    endNonce?: number,
  ): ElasticQuery {
    let query = ElasticQuery.create()
      .withMustExistCondition('nonce')
      .withMustCondition(
        QueryType.Match('token', collection, QueryOperator.AND),
      )
      .withFields(['nft_traitValues'])
      .withPagination({
        from: 0,
        size: constants.getNftsFromElasticBatchSize,
      });
    if (startNonce !== undefined && endNonce !== undefined) {
      query = query.withRangeFilter(
        'nonce',
        new RangeGreaterThan(startNonce),
        new RangeLowerThanOrEqual(endNonce),
      );
    }
    return query;
  }

  getAllEncodedNftValuesFromElasticBeforeTimestampQuery(
    beforeTimestamp?: number,
  ): ElasticQuery {
    let query = ElasticQuery.create()
      .withMustExistCondition('nonce')
      .withFields(['nft_traitValues', 'timestamp', 'identifier'])
      .withRangeFilter('timestamp', new RangeLowerThanOrEqual(beforeTimestamp))
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.descending }])
      .withPagination({
        from: 0,
        size: constants.getNftsFromElasticBatchSize,
      });
    return query;
  }

  getAllNftsWithTraitsFromElasticQuery(batchSize: number): ElasticQuery {
    return ElasticQuery.create()
      .withMustExistCondition('nonce')
      .withMustExistCondition('nft_traitValues')
      .withFields(['nft_traitValues'])
      .withPagination({
        from: 0,
        size: batchSize ?? constants.getNftsFromElasticBatchSize,
      });
  }

  getAllCollectionsFromElasticQuery(): ElasticQuery {
    return ElasticQuery.create()
      .withMustExistCondition('token')
      .withMustNotExistCondition('nonce')
      .withMustMultiShouldCondition(
        [NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT],
        (type) => QueryType.Match('type', type),
      )
      .withPagination({
        from: 0,
        size: constants.getCollectionsFromElasticBatchSize,
      });
  }

  getNftWithTraitValuesFromElasticQuery(identifier: string): ElasticQuery {
    return ElasticQuery.create()
      .withMustExistCondition('nonce')
      .withMustCondition(
        QueryType.Match('identifier', identifier, QueryOperator.AND),
      )
      .withFields(['nft_traitValues'])
      .withPagination({
        from: 0,
        size: 1,
      });
  }
}

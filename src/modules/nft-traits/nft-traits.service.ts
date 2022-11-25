import { Injectable, Logger } from '@nestjs/common';
import { ElrondApiService, Nft } from 'src/common';
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
import { Sort } from '../common/filters/filtersTypes';
import { DocumentDbService } from 'src/document-db/document-db.service';
import { NftTraitsElasticService } from './nft-traits.elastic.service';

@Injectable()
export class NftTraitsService {
  constructor(
    private readonly apiService: ElrondApiService,
    private readonly nftTraitsElasticService: NftTraitsElasticService,
    private readonly documentDbService: DocumentDbService,
    private readonly logger: Logger,
  ) {}

  async updateCollectionTraits(collectionTicker: string): Promise<boolean> {
    this.logger.log(`Validating/updating traits for ${collectionTicker}...`);
    try {
      const [collectionTraitSummaryFromDb, nftsCount]: [
        CollectionTraitSummary,
        number,
      ] = await Promise.all([
        this.getCollectionTraitSummaryFromDb(collectionTicker),
        this.apiService.getCollectionNftsCount(collectionTicker),
      ]);

      if (nftsCount === 0) {
        if (collectionTraitSummaryFromDb) {
          await this.documentDbService.deleteTraitSummary(collectionTicker);
        }
        this.logger.log(`${collectionTicker} - VALID`);
        return false;
      }

      if (this.isCollectionTooBig(collectionTicker, nftsCount)) {
        await this.documentDbService.updateTraitSummaryLastUpdated(
          collectionTicker,
        );
        await this.nftTraitsElasticService.setCollectionTraitsFlagInElastic(
          collectionTicker,
        );
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
        this.logger.log(`${collectionTicker} - VALID`);
        await this.documentDbService.updateTraitSummaryLastUpdated(
          collectionTicker,
        );
        await this.nftTraitsElasticService.setCollectionTraitsFlagInElastic(
          collectionTicker,
        );
        return false;
      }

      if (!areCollectionSummariesIdentical || !collectionTraitSummaryFromDb) {
        await this.documentDbService.saveOrUpdateTraitSummary(
          collectionTraitSummary,
        );
        await this.nftTraitsElasticService.setCollectionTraitsFlagInElastic(
          collectionTicker,
        );
        this.logger.log(
          `${collectionTicker} - Updated collection trait summary`,
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
          nftsCount,
          lastNonce + 1,
          lastNonce + batchSize,
        ),
        this.nftTraitsElasticService.getAllEncodedNftValuesFromElastic(
          collection,
          lastNonce + 1,
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
    await this.nftTraitsElasticService.setNftsValuesInElastic(
      notIdenticalEncodedValues,
    );
    return notIdenticalEncodedValues.length;
  }

  async updateAllCollectionTraits(): Promise<void> {
    await Locker.lock(
      'updateAllCollectionTraits: Update traits for all existing collections',
      async () => {
        try {
          let collections: string[] =
            await this.nftTraitsElasticService.getAllCollectionsFromElastic();

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
        this.nftTraitsElasticService.getNftValuesFromElastic(identifier),
        this.apiService.getCollectionNftsCount(collection),
      ]);

    if (this.isCollectionTooBig(collection, nftsCount)) {
      await this.documentDbService.updateTraitSummaryLastUpdated(collection);
      await this.nftTraitsElasticService.setCollectionTraitsFlagInElastic(
        collection,
      );
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

    const noNftTraitsInElastic = !nftTraitValuesFromElastic?.length;
    if (nftTraitsFromApi.hasTraits() && noNftTraitsInElastic) {
      this.logger.log(`${identifier} - MINT`);
      const traitSummaryFromDb: CollectionTraitSummary =
        await this.getCollectionTraitSummaryFromDb(collection);
      return await this.mintCollectionNft(
        new CollectionTraitSummary({
          identifier: collection,
          traitTypes: traitSummaryFromDb?.traitTypes ?? {},
        }),
        nftTraitsFromApi,
      );
    } else if (!areIdenticalTraits) {
      this.logger.log(
        `${identifier} - Outdated traits => update collection trait summary`,
      );
      return await this.updateCollectionTraits(collection);
    }
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
      this.nftTraitsElasticService.setNftsTraitsInElastic([nftTraitsFromApi]),
      this.documentDbService.saveOrUpdateTraitSummary(traitSummaryFromElastic),
    ]);
    return true;
  }

  async getCollectionNftsByTraitsAndRanks(
    collection: string,
    traits: NftTrait[],
    limit: number,
    offset: number,
    sortByRank?: Sort,
  ): Promise<[Nft[], number]> {
    return await this.apiService.getCollectionNftsAndCount(
      collection,
      new AssetsQuery()
        .addTraits(traits)
        .addSortByRank(sortByRank)
        .addPageSize(offset, limit)
        .build(),
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

  private async getAllCollectionNftsFromAPI(
    collectionTicker: string,
    collectionNftsCount: number,
    startNonce?: number,
    endNonce?: number,
  ): Promise<NftTraits[]> {
    try {
      const res = await this.apiService.getAllNftsByCollectionAfterNonce(
        collectionTicker,
        'identifier,nonce,timestamp,metadata',
        collectionNftsCount,
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
        'withOwner=true&withSupply=true&fields=metadata',
      );
      return new NftTraits({
        identifier: identifier,
        traits: Array.isArray(metadata?.attributes)
          ? metadata?.attributes
              ?.filter((a) => (a.trait_type || a.name) && a.value)
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
    const collectionTraitSummary = await this.documentDbService.getTraitSummary(
      collection,
    );
    return (
      collectionTraitSummary ??
      new CollectionTraitSummary({ identifier: collection, traitTypes: {} })
    );
  }

  private isCollectionTooBig(collection: string, nftsCount: number): boolean {
    if (nftsCount > constants.nftsCountThresholdForTraitAndRarityIndexing) {
      this.logger.log(
        `${collection} - Collection NFTs count bigger than threshold (${nftsCount} > ${constants.nftsCountThresholdForTraitAndRarityIndexing})`,
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
            const [[nftsBatch, lastTimestamp], nftsFromelasticDictionary] =
              await Promise.all([
                this.apiService.getNftsWithAttributesBeforeTimestamp(
                  beforeTimestamp,
                  batchSize,
                ),
                this.nftTraitsElasticService.getAllNftsWithTraitsFromElastic(
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
                      ?.filter((a) => (a.trait_type || a.name) && a.value)
                      ?.map(NftTrait.fromNftMetadataAttribute)
                  : [],
              });

              let nftFromElastic = nftsFromelasticDictionary[nft.identifier];
              if (!nftFromElastic) {
                nftFromElastic =
                  await this.nftTraitsElasticService.getNftValuesFromElastic(
                    nft.identifier,
                  );
              }

              const areIdenticalTraits = this.areIdenticalTraits(
                nftTraitsFromApi.traits,
                nftFromElastic,
              );

              if (!areIdenticalTraits) {
                const logMssage = nftFromElastic
                  ? 'Not identical traits'
                  : 'Missing NFT from Elastic';
                this.logger.log(`${nft.identifier} - ${logMssage}`);
                await this.updateNftTraits(nft.identifier);
                totalProcessedNfts++;
                continue;
              }

              totalProcessedNfts++;
            }

            if (lastTimestamp === beforeTimestamp) {
              this.logger.log(
                `Processed ${totalProcessedNfts} in ${iterations} iterations of ${batchSize} NFTs`,
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
}

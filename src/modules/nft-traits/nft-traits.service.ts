import {
  ElasticQuery,
  QueryType,
  QueryOperator,
  BinaryUtils,
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
    const nftsCount = await this.apiService.getCollectionNftsCount(
      collectionTicker,
    );
    if (nftsCount > constants.maxCollectionNftsCountThreshold) {
      await this.persistenceService.saveOrUpdateTraitSummary(
        new CollectionTraitSummary({
          identifier: collectionTicker,
          traitTypes: [],
        }),
      );
      this.logger.log(
        `${collectionTicker} - Collection NFTs count bigger than threshold`,
        {
          path: `${NftTraitsService.name}.${this.updateCollectionTraits.name}`,
          nftsCount: nftsCount,
        },
      );
      return false;
    }

    const [
      nftsFromApi,
      encodedNftValuesFromElastic,
      collectionTraitSummaryFromDb,
    ]: [NftTraits[], EncodedNftValues[], CollectionTraitSummary] =
      await Promise.all([
        this.getAllCollectionNftsFromAPI(collectionTicker),
        this.getAllEncodedNftValuesFromElastic(collectionTicker),
        this.getCollectionTraitsFromDb(collectionTicker),
      ]);

    console.log(nftsFromApi.length);
    console.log(encodedNftValuesFromElastic.length);

    if (nftsFromApi.length === 0) {
      await this.persistenceService.saveOrUpdateTraitSummary(
        new CollectionTraitSummary({
          identifier: collectionTicker,
          traitTypes: [],
        }),
      );
      this.logger.log(`${collectionTicker} - Empty collection`, {
        path: `${NftTraitsService.name}.${this.updateCollectionTraits.name}`,
      });
      return false;
    }

    const collectionTraitSummary = this.computeCollectionTraitsSummary(
      collectionTicker,
      nftsFromApi,
    );

    const notIdenticalEncodedValues: EncodedNftValues[] =
      this.getNotIdenticalNftValues(nftsFromApi, encodedNftValuesFromElastic);

    const areCollectionSummariesIdentical = collectionTraitSummary.isIdentical(
      collectionTraitSummaryFromDb,
    );

    if (
      notIdenticalEncodedValues.length === 0 &&
      areCollectionSummariesIdentical
    ) {
      this.logger.log(`${collectionTicker} - VALID`, {
        path: `${NftTraitsService.name}.${this.updateCollectionTraits.name}`,
      });
      return false;
    }

    if (notIdenticalEncodedValues.length > 0) {
      await this.setNftsValuesInElastic(notIdenticalEncodedValues);
      this.logger.log(
        `${collectionTicker} - Updated ${notIdenticalEncodedValues.length}/${nftsFromApi.length} NFTs`,
        {
          path: `${NftTraitsService.name}.${this.updateCollectionTraits.name}`,
        },
      );
    }

    if (!areCollectionSummariesIdentical || !collectionTraitSummaryFromDb) {
      await this.persistenceService.saveOrUpdateTraitSummary(
        collectionTraitSummary,
      );
      this.logger.log(
        `${collectionTicker} - Updated collection trait summary`,
        {
          path: `${NftTraitsService.name}.${this.updateCollectionTraits.name}`,
        },
      );
    }

    return true;
  }

  async updateTraitsForAllCollections(): Promise<void> {
    await Locker.lock(
      'updateTraitsForAllCollections: Update traits for all existing collections',
      async () => {
        const query: ElasticQuery = ElasticQuery.create()
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
            path: `${NftTraitsService.name}.${this.updateTraitsForAllCollections.name}`,
            exception: error?.message,
          });
        }
      },
      true,
    );
  }

  async updateNftTraits(identifier: string): Promise<boolean> {
    const { collection } = getCollectionAndNonceFromIdentifier(identifier);
    let [nftTraitsFromApi, nftTraitValuesFromElastic] = await Promise.all([
      this.getCollectionNftMetadataFromAPI(identifier),
      this.getNftValuesFromElastic(identifier),
    ]);

    const areIdenticalTraits = this.areIdenticalTraits(
      nftTraitsFromApi.traits,
      nftTraitValuesFromElastic,
    );

    if (nftTraitsFromApi && !areIdenticalTraits) {
      this.logger.log(`${identifier} - MINT/UPDATE`, {
        path: `${NftTraitsService.name}.${this.updateNftTraits.name}`,
      });
      const traitSummaryFromDb: CollectionTraitSummary =
        await this.getCollectionTraitsFromDb(collection);
      return await this.mintCollectionNft(
        new CollectionTraitSummary({
          identifier: collection,
          traitTypes: traitSummaryFromDb?.traitTypes ?? [],
        }),
        nftTraitsFromApi,
      );
    } else if (
      nftTraitsFromApi &&
      nftTraitValuesFromElastic &&
      !areIdenticalTraits
    ) {
      this.logger.log(`${identifier} - Unknown problem => update collection`, {
        path: `${NftTraitsService.name}.${this.updateNftTraits.name}`,
      });
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
    traitSummaryFromElastic = traitSummaryFromElastic.addNftTraitsToCollection(
      nftTraitsFromApi.traits,
      nftTraitsFromApi.traits.length,
    );
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
    if (traits?.length !== traitValues.length) {
      return false;
    }
    for (const trait of traits) {
      if (!traitValues.includes(this.traitToBase64Encoded(trait))) {
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
      const currentEncodedNftValues = encodedNftValuesFromElastic.find(
        (encodedNft) => encodedNft.identifier === nft.identifier,
      );

      const newEncodedNftValues = nft?.traits?.map((trait) =>
        this.traitToBase64Encoded(trait),
      );

      if (newEncodedNftValues.length === 0 && !currentEncodedNftValues) {
        continue;
      }

      const newEncodedNftValue = new EncodedNftValues({
        identifier: nft.identifier,
        encodedValues: newEncodedNftValues ?? [],
      });

      if (
        newEncodedNftValues.length !==
        currentEncodedNftValues?.encodedValues?.length
      ) {
        notIdenticalEncodedValues.push(newEncodedNftValue);
        continue;
      }

      for (const newEncodedValue of newEncodedNftValues) {
        if (
          !currentEncodedNftValues?.encodedValues?.find(
            (value) => value === newEncodedValue,
          )
        ) {
          notIdenticalEncodedValues.push(newEncodedNftValue);
          break;
        }
      }
    }

    for (const encodedNft of encodedNftValuesFromElastic) {
      const nft = nftsFromApi.find(
        (nft) => nft.identifier === encodedNft.identifier,
      );

      if (nft?.traits?.length !== encodedNft.encodedValues.length) {
        if (
          !notIdenticalEncodedValues.find(
            (n) => n.identifier === encodedNft.identifier,
          )
        ) {
          notIdenticalEncodedValues.push(encodedNft);
        }
        continue;
      }
    }

    return notIdenticalEncodedValues;
  }

  private computeCollectionTraitsSummary(
    collectionTicker: string,
    nfts: NftTraits[],
  ): CollectionTraitSummary {
    let collectionTraits: CollectionTraitSummary = new CollectionTraitSummary({
      identifier: collectionTicker,
      traitTypes: [],
    });

    for (const nft of nfts) {
      if (nft.traits) {
        collectionTraits = collectionTraits.addNftTraitsToCollection(
          nft.traits,
          nfts.length,
        );
      }
    }

    return collectionTraits;
  }

  private buildNftTraitsBulkUpdate(nfts: NftTraits[]): string[] {
    let updates: string[] = [];
    nfts.forEach((nft) => {
      const payload = this.elasticService.buildBulkUpdate<string[]>(
        'tokens',
        nft.identifier,
        'nft_traitValues',
        nft.traits.map((t) => this.traitToBase64Encoded(t)),
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
  ): Promise<NftTraits[]> {
    try {
      const res = await this.apiService.getAllNftsByCollection(
        collectionTicker,
        'identifier,nonce,timestamp,metadata',
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

  private async getCollectionTraitsFromDb(
    collection: string,
  ): Promise<CollectionTraitSummary> {
    const collectionTraitSummary =
      await this.persistenceService.getTraitSummary(collection);
    return (
      collectionTraitSummary ??
      new CollectionTraitSummary({ identifier: collection, traitTypes: [] })
    );
  }

  private async getNftValuesFromElastic(identifier: string): Promise<string[]> {
    let nftValues: string[] = [];

    try {
      const query = ElasticQuery.create()
        .withMustExistCondition('nonce')
        .withMustCondition(
          QueryType.Match('identifier', identifier, QueryOperator.AND),
        )
        .withFields(['nft_traitValues'])
        .withPagination({
          from: 0,
          size: constants.getNftsFromElasticBatchSize,
        });

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
  ): Promise<EncodedNftValues[]> {
    let encodedNftValues: EncodedNftValues[] = [];

    try {
      const query = ElasticQuery.create()
        .withMustExistCondition('nonce')
        .withMustCondition(
          QueryType.Match('token', collection, QueryOperator.AND),
        )
        .withFields(['nft_traitValues'])
        .withPagination({
          from: 0,
          size: constants.getNftsFromElasticBatchSize,
        });

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

  traitToBase64Encoded(trait: NftTrait): string {
    return BinaryUtils.base64Encode(`${trait.name}_${trait.value}`);
  }
}

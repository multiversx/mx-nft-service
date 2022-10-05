import {
  ElasticQuery,
  QueryType,
  QueryOperator,
  BinaryUtils,
} from '@elrondnetwork/erdnest';
import { Injectable, Logger } from '@nestjs/common';
import { ElrondApiService, ElrondElasticService, Nft } from 'src/common';
import { NftTypeEnum } from '../assets/models';
import { CollectionTraits, TraitType } from './models/collection-traits.model';
import { NftTrait, NftTraits } from './models/nft-traits.model';
import * as JsonDiff from 'json-diff';
import { getCollectionAndNonceFromIdentifier } from 'src/utils/helpers';
import { AssetsQuery } from '../assets';
import { constants } from 'src/config';
import { Locker } from 'src/utils/locker';

@Injectable()
export class NftTraitsService {
  constructor(
    private readonly apiService: ElrondApiService,
    private readonly elasticService: ElrondElasticService,
    private readonly logger: Logger,
  ) {
    this.setElasticTraitMappings();
  }

  async updateCollectionTraits(
    collectionTicker: string,
    forceRefresh: boolean = false,
  ): Promise<boolean> {
    const allNfts: NftTraits[] = await this.getAllCollectionNftsFromAPI(
      collectionTicker,
    );

    if (allNfts?.length === 0) {
      this.setCollectionTraitTypesInElastic(
        new CollectionTraits({ identifier: collectionTicker, traitTypes: [] }),
      );
      return false;
    }

    const getTraitTypeFromElasticPromise =
      this.getCollectionTraitsFromElastic(collectionTicker);

    const collectionTraits = this.getCollectionTraits(
      collectionTicker,
      allNfts,
    );

    const collectionTraitsFromElastic: TraitType[] =
      await getTraitTypeFromElasticPromise;

    if (
      forceRefresh === true ||
      JsonDiff.diff(collectionTraitsFromElastic, collectionTraits.traitTypes)
    ) {
      await this.setNftsTraitsInElastic(allNfts);
      await this.setCollectionTraitTypesInElastic(collectionTraits);
      return true;
    }

    return false;
  }

  async updateAllCollections(): Promise<void> {
    await Locker.lock(
      'processTokenTraitsQueue: Update traits for all collections in the traits queue',
      async () => {
        let lastBatchSize: number;

        const query: ElasticQuery = ElasticQuery.create()
          .withMustExistCondition('token')
          .withMustNotExistCondition('nonce')
          .withMustNotCondition(QueryType.Match('nft_hasTraitSummary', true))
          .withMustMultiShouldCondition(
            [NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT],
            (type) => QueryType.Match('type', type),
          )
          .withPagination({
            from: 0,
            size: constants.getCollectionsFromElasticBatchSize,
          });

        do {
          try {
            let collections: string[] = [];

            await this.elasticService.getScrollableList(
              'tokens',
              'token',
              query,
              async (items) => {
                collections = collections.concat(
                  [...new Set(items.map((i) => i.token))], //.filter(
                );
              },
              constants.getCollectionsFromElasticBatchSize,
            );

            lastBatchSize = collections.length;
            console.log(lastBatchSize);

            for (const collection of collections) {
              console.log(collection);
              await this.updateCollectionTraits(collection);
            }
          } catch (error) {
            console.log(error);
          }
        } while (lastBatchSize !== 0);
      },
      true,
    );
  }

  async updateNftTraits(identifier: string): Promise<boolean> {
    const { collection } = getCollectionAndNonceFromIdentifier(identifier);
    let collectionPromise = this.getCollectionTraitsFromElastic(collection);

    let [nftTraitsFromApi, nftTraitValuesFromElastic] = await Promise.all([
      this.getCollectionNftMetadataFromAPI(identifier),
      this.getNftValuesFromElastic(identifier),
    ]);

    if (nftTraitsFromApi && !nftTraitValuesFromElastic) {
      return await this.mintCollectionNft(
        new CollectionTraits({
          identifier: collection,
          traitTypes: await collectionPromise,
        }),
        nftTraitsFromApi,
      );
    } else if (!nftTraitsFromApi && nftTraitValuesFromElastic) {
      return await this.burnCollectionNft(collection);
    } else if (
      nftTraitsFromApi &&
      nftTraitValuesFromElastic &&
      !this.areIdenticalTraits(
        nftTraitsFromApi.traits,
        nftTraitValuesFromElastic,
      )
    ) {
      const forceRefresh = true;
      return await this.updateCollectionTraits(collection, forceRefresh);
    }

    return false;
  }

  async mintCollectionNft(
    collection: CollectionTraits,
    nftTraits: NftTraits,
  ): Promise<boolean> {
    collection = collection.addNftTraitsToCollection(nftTraits.traits);
    await Promise.all([
      this.setCollectionTraitTypesInElastic(collection),
      this.setNftsTraitsInElastic([nftTraits]),
    ]);
    return true;
  }

  async burnCollectionNft(collectionTicker: string): Promise<boolean> {
    const forceRefresh = true;
    return await this.updateCollectionTraits(collectionTicker, forceRefresh);
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
    let identicalTraitsCount = 0;
    for (const trait of traits) {
      if (traitValues.includes(`${trait.name}_${trait.value}`)) {
        identicalTraitsCount++;
      }
    }
    if (identicalTraitsCount === traitValues.length) {
      return true;
    }
    return false;
  }

  private getCollectionTraits(
    collectionTicker: string,
    nfts: NftTraits[],
  ): CollectionTraits {
    let collectionTraits: CollectionTraits = new CollectionTraits({
      identifier: collectionTicker,
      traitTypes: [],
    });

    for (const nft of nfts) {
      collectionTraits = collectionTraits.addNftTraitsToCollection(
        nft.traits,
        nfts.length,
      );
    }

    return collectionTraits;
  }

  private async setCollectionTraitTypesInElastic(
    collection: CollectionTraits,
  ): Promise<void> {
    try {
      const updateBody = this.elasticService.buildUpdateBody<TraitType[]>(
        'nft_traitSummary',
        collection.traitTypes,
      );
      await this.elasticService.setCustomValue(
        'tokens',
        collection.identifier,
        updateBody,
        '?retry_on_conflict=2&timeout=1m',
      );
    } catch (error) {
      this.logger.error('Error when setting collection trait types', {
        path: 'NftRarityService.setCollectionTraitTypesInElastic',
        exception: error?.message,
        collection: collection.identifier,
      });
      this.logger.error(error);
    }
  }

  private buildNftTraitsBulkUpdate(nfts: NftTraits[]): string[] {
    let updates: string[] = [];
    nfts.forEach((nft) => {
      const payload = this.elasticService.buildBulkUpdate<string[]>(
        'tokens',
        nft.identifier,
        'nft_traitValues',
        nft.traits.map((t) => BinaryUtils.base64Encode(`${t.name}_${t.value}`)),
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
          path: 'NftRarityService.setNftsTraitsInElastic',
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
        'identifier,nonce,metadata,score,rank,timestamp',
      );
      return res?.map(NftTraits.fromNft) ?? [];
    } catch (error) {
      this.logger.error(`Error when getting all collection NFTs from API`, {
        path: 'NftRarityService.getAllCollectionNftsFromAPI',
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
        traits:
          metadata?.attributes?.map(NftTrait.fromNftMetadataAttribute) ?? [],
      });
    } catch (error) {
      this.logger.error(`Error when getting NFT from API`, {
        path: 'NftRarityService.getCollectionNftFromAPI',
        exception: error?.message,
        identifier: identifier,
      });
    }
  }

  private async getCollectionTraitsFromElastic(
    collectionTicker: string,
  ): Promise<TraitType[]> {
    let traitTypes: TraitType[];

    const query = ElasticQuery.create()
      .withMustNotExistCondition('nonce')
      .withMustExistCondition('token')
      .withMustMultiShouldCondition(
        [NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT],
        (type) => QueryType.Match('type', type),
      )
      .withMustCondition(
        QueryType.Match('token', collectionTicker, QueryOperator.AND),
      );

    await this.elasticService.getScrollableList(
      'tokens',
      'identifier',
      query,
      async (items) => {
        traitTypes = items[0].nft_traitSummary;
        return undefined;
      },
    );

    return traitTypes;
  }

  private async getNftValuesFromElastic(identifier: string): Promise<string[]> {
    let nftValues: string[];

    try {
      const query = ElasticQuery.create()
        .withMustExistCondition('nonce')
        .withMustCondition(
          QueryType.Match('identifier', identifier, QueryOperator.AND),
        )
        .withMustCondition(
          QueryType.Nested('data', { 'data.nonEmptyURIs': true }),
        )
        .withMustCondition(
          QueryType.Nested('data', { 'data.whiteListedStorage': true }),
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
          nftValues = items[0].nft_traitValues;
          return undefined;
        },
      );
    } catch (error) {
      this.logger.error(`Error when getting  NFT trait values from Elastic`, {
        path: 'NftRarityService.getNftTraitsFromElastic',
        exception: error?.message,
        identifier: identifier,
      });
    }

    return nftValues;
  }

  async setElasticTraitMappings(): Promise<void> {
    try {
      await this.elasticService.putMappings(
        'tokens',
        this.elasticService.buildPutMultipleMappingsBody([
          {
            key: 'nft_traitSummary.attributes.occurencePercentage',
            value: 'float',
          },
          {
            key: 'nft_traitSummary.attributes.occurenceCount',
            value: 'long',
          },
          {
            key: 'nft_traitSummary.occurencePercentage',
            value: 'float',
          },
          {
            key: 'nft_traitSummary.occurenceCount',
            value: 'long',
          },
        ]),
      );
    } catch (error) {
      this.logger.error(
        'Error when trying to map Elastic types for trait variables',
        {
          path: 'NftTraitsService.setElasticTraitMappings',
        },
      );
    }
  }
}

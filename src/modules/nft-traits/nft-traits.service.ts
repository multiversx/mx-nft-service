import { ElasticQuery, QueryType, QueryOperator } from '@elrondnetwork/erdnest';
import { Injectable, Logger } from '@nestjs/common';
import { ElrondApiService, ElrondElasticService, Nft } from 'src/common';
import { NftTypeEnum } from '../assets/models';
import { CollectionTraits, TraitType } from './models/collection-traits.model';
import { NftTrait, NftTraits } from './models/nft-traits.model';
import * as JsonDiff from 'json-diff';
import { getCollectionAndNonceFromIdentifier } from 'src/utils/helpers';
import { AssetsQuery } from '../assets';

@Injectable()
export class NftTraitsService {
  constructor(
    private readonly apiService: ElrondApiService,
    private readonly elasticService: ElrondElasticService,
    private readonly logger: Logger,
  ) {}

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
      await Promise.all([
        this.setCollectionTraitTypesInElastic(collectionTraits),
        this.setNftsTraitsInElastic(allNfts),
      ]);
      return true;
    }

    return false;
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
        'nft_traitTypes',
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
    }
  }

  private buildNftTraitsBulkUpdate(nfts: NftTraits[]): string[] {
    let updates: string[] = [];
    nfts.forEach((nft) => {
      updates.push(
        this.elasticService.buildBulkUpdate<string[]>(
          'tokens',
          nft.identifier,
          'nft_traitValues',
          nft.traits.map((t) => `${t.name}_${t.value}`),
        ),
      );
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
        traitTypes = items[0].nft_traitTypes;
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
        .withPagination({ from: 0, size: 100 });

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
}

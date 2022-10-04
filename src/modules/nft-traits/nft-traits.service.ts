import { ElasticQuery, QueryType, QueryOperator } from '@elrondnetwork/erdnest';
import { Injectable, Logger } from '@nestjs/common';
import { ElrondApiService, ElrondElasticService } from 'src/common';
import { NftTypeEnum } from '../assets/models';
import {
  AttributeType,
  CollectionTraits,
  TraitType,
} from './models/collection-traits.model';
import { NftTrait, NftTraits } from './models/nft-traits.model';

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
      JSON.stringify(collectionTraitsFromElastic) !==
        JSON.stringify(collectionTraits.traitTypes)
    ) {
      await Promise.all([
        this.setCollectionTraitTypesInElastic(collectionTraits),
        this.setNftsTraitsInElastic(allNfts),
      ]);
    }

    return true;
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
      for (const trait of nft.traits) {
        let collectionTrait: TraitType = collectionTraits.traitTypes.find(
          (t) => t.name === trait.name,
        );

        if (collectionTrait) {
          collectionTrait.occurenceCount++;
          collectionTrait.occurencePercentage =
            (collectionTrait.occurenceCount / nfts.length) * 100;
          let attribute = collectionTrait.attributes.find(
            (a) => a.name === trait.value,
          );
          if (!attribute) {
            collectionTrait.attributes.push(
              new AttributeType({
                name: trait.value,
                occurenceCount: 1,
                occurencePercentage: (1 / nfts.length) * 100,
              }),
            );
          } else {
            attribute.occurenceCount++;
            attribute.occurencePercentage =
              (attribute.occurenceCount / nfts.length) * 100;
          }
        } else {
          collectionTraits.traitTypes.push(
            new TraitType({
              name: trait.name,
              attributes: [
                new AttributeType({
                  name: trait.name,
                  occurenceCount: 1,
                  occurencePercentage: (1 / nfts.length) * 100,
                }),
              ],
              occurenceCount: 1,
              occurencePercentage: (1 / nfts.length) * 100,
            }),
          );
        }
      }
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
        this.elasticService.buildBulkUpdate<NftTrait[]>(
          'tokens',
          nft.identifier,
          'nft_traits',
          nft.traits,
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
      return res.map(NftTraits.fromNft);
    } catch (error) {
      this.logger.error(`Error when getting all collection NFTs from API`, {
        path: 'NftRarityService.getAllCollectionNftsFromAPI',
        exception: error?.message,
        collection: collectionTicker,
      });
    }
  }

  // private async getAllCollectionNftsFromElastic(
  //   collectionTicker: string,
  // ): Promise<NftTraits[]> {
  //   let nfts: NftTraits[] = [];

  //   try {
  //     const query = ElasticQuery.create()
  //       .withMustExistCondition('nonce')
  //       .withMustCondition(
  //         QueryType.Match('token', collectionTicker, QueryOperator.AND),
  //       )
  //       .withMustCondition(
  //         QueryType.Nested('data', { 'data.nonEmptyURIs': true }),
  //       )
  //       .withMustCondition(
  //         QueryType.Nested('data', { 'data.whiteListedStorage': true }),
  //       )
  //       .withFields(['nft_traits', 'nft_rarity_rank', 'nonce'])
  //       .withPagination({ from: 0, size: 10000 });

  //     await this.elasticService.getScrollableList(
  //       'tokens',
  //       'identifier',
  //       query,
  //       async (items) => {
  //         nfts = nfts.concat(items.map((nft) => NftTraits.fromElasticNft(nft)));
  //         return undefined;
  //       },
  //     );
  //   } catch (error) {
  //     this.logger.error(`Error when getting all collection NFTs from Elastic`, {
  //       path: 'NftRarityService.getAllCollectionNftsFromElastic',
  //       exception: error?.message,
  //       collection: collectionTicker,
  //     });
  //   }

  //   return nfts;
  // }

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
        traitTypes = items[0].nft_traitTypes.map(
          (trait) =>
            new TraitType({
              name: trait.name,
              attributes: trait.attributes.map(
                (attribute) =>
                  new AttributeType({
                    name: attribute.name,
                    occurenceCount: attribute.occurenceCount,
                    occurencePercentage: attribute.occurencePercentage,
                  }),
              ),
              occurenceCount: trait.occurenceCount,
              occurencePercentage: trait.occurencePercentage,
            }),
        );
        return undefined;
      },
    );

    return traitTypes;
  }
}

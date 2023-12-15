import { Injectable, Logger } from '@nestjs/common';
import { MxElasticService } from 'src/common';
import { ElasticQuery, ElasticSortOrder, MatchQuery, QueryOperator, QueryType } from '@multiversx/sdk-nestjs-elastic';
import { Locker } from '@multiversx/sdk-nestjs-common';
import { NftTypeEnum } from '../assets/models';
import { NftRarityData } from './models/nft-rarity-data.model';
import { constants } from 'src/config';
import { CustomRank } from './models/custom-rank.model';
import { CollectionFromElastic } from './models/collection-from-elastic.model';
import { Rarity } from '../assets/models/Rarity';
import {
  ELASTIC_NFT_HASRARITY,
  ELASTIC_NFT_RANK_CUSTOM,
  ELASTIC_NFT_RANK_HASH,
  ELASTIC_NFT_RANK_JACCARD,
  ELASTIC_NFT_RANK_OPENRARITY,
  ELASTIC_NFT_RANK_STATISTICAL,
  ELASTIC_NFT_RANK_TRAIT,
  ELASTIC_NFT_SCORE_JACCARD,
  ELASTIC_NFT_SCORE_OPENRARITY,
  ELASTIC_NFT_SCORE_STATISTICAL,
  ELASTIC_NFT_SCORE_TRAIT,
  ELASTIC_TOKENS_INDEX,
} from 'src/utils/constants';

@Injectable()
export class NftRarityElasticService {
  constructor(private readonly elasticService: MxElasticService, private readonly logger: Logger) {}

  async setCollectionRarityFlagInElastic(collection: string, hasRarities: boolean, currentFlagValue?: boolean): Promise<void> {
    if (hasRarities === currentFlagValue) {
      return;
    }

    try {
      const updateBody = this.elasticService.buildUpdateBody<boolean>('nft_hasRarities', hasRarities);
      await this.elasticService.setCustomValue(ELASTIC_TOKENS_INDEX, collection, updateBody, '?retry_on_conflict=2&timeout=1m');
    } catch (error) {
      this.logger.error('Error when setting collection rarity flag', {
        path: 'NftRarityService.updateRarities',
        exception: error?.message,
        collection: collection,
      });
    }
  }

  async setNftRaritiesInElastic(nfts: NftRarityData[], hasRarities: boolean = true, nftsFromElastic?: NftRarityData[]): Promise<void> {
    if (!nfts || nfts.length === 0) {
      return;
    }

    let outdatedNfts = [];
    if (nftsFromElastic) {
      for (let i = 0; i < nfts.length; i++) {
        const nftFromElastic = nftsFromElastic.find((nft) => nft.identifier === nfts[i].identifier);

        if (nftFromElastic.hasRarity !== hasRarities || Rarity.areDifferentRarities(nftFromElastic.rarities, nfts[i].rarities)) {
          outdatedNfts.push(nfts[i]);
        }
      }
    } else {
      outdatedNfts = nfts;
    }

    try {
      await this.elasticService.bulkRequest(
        ELASTIC_TOKENS_INDEX,
        this.buildNftRaritiesBulkUpdate(outdatedNfts, hasRarities),
        '?timeout=1m',
      );
    } catch (error) {
      this.logger.error('Error when bulk updating nft rarities Elastic', {
        path: 'NftRarityService.setNftRaritiesInElastic',
        exception: error?.message,
      });
    }
  }

  async setNftCustomRanksInElastic(collection: string, customRanks: CustomRank[], nftsFromElastic?: any): Promise<void> {
    let outdatedRanks = [];
    if (nftsFromElastic) {
      for (let i = 0; i < customRanks.length; i++) {
        const nftFromElastic = nftsFromElastic.find((nft) => nft.identifier === customRanks[i].identifier);
        if (nftFromElastic.nft_rank_custom !== customRanks[i].rank) {
          outdatedRanks.push(customRanks[i]);
        }
      }
    } else {
      outdatedRanks = customRanks;
    }

    if (customRanks.length > 0) {
      try {
        await this.elasticService.bulkRequest(
          ELASTIC_TOKENS_INDEX,
          this.buildNftCustomRanksBulkUpdate(collection, outdatedRanks),
          '?timeout=1m',
        );
      } catch (error) {
        this.logger.error('Error when bulk updating nft custom ranks inElastic', {
          path: 'NftRarityService.setNftCustomRanksInElastic',
          exception: error?.message,
        });
      }
    }
  }

  async getCollectionCustomRanksHash(collectionTicker: string): Promise<string> {
    let hash: string;
    try {
      const query = ElasticQuery.create()
        .withMustNotExistCondition('nonce')
        .withMustExistCondition('token')
        .withMustMultiShouldCondition([NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT], (type) => QueryType.Match('type', type))
        .withMustCondition(QueryType.Match('token', collectionTicker, QueryOperator.AND))
        .withFields([ELASTIC_NFT_RANK_HASH])
        .withPagination({
          from: 0,
          size: 1,
        });

      await this.elasticService.getScrollableList(ELASTIC_TOKENS_INDEX, 'identifier', query, async (items) => {
        hash = items[0].nft_custom_ranks_hash;
        return undefined;
      });
    } catch (error) {
      this.logger.error(`Error when getting collection rarity flag`, {
        path: `${NftRarityElasticService.name}.${this.getCollectionCustomRanksHash.name}`,
        exception: error?.message,
        collection: collectionTicker,
      });
    }
    return hash;
  }

  async getCollectionRarityFlag(collectionTicker: string): Promise<boolean> {
    let hasRarities: boolean;

    try {
      const query = ElasticQuery.create()
        .withMustNotExistCondition('nonce')
        .withMustExistCondition('token')
        .withMustMultiShouldCondition([NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT], (type) => QueryType.Match('type', type))
        .withMustCondition(QueryType.Match('token', collectionTicker, QueryOperator.AND))
        .withFields(['nft_hasRarities'])
        .withPagination({
          from: 0,
          size: 1,
        });

      await this.elasticService.getScrollableList(ELASTIC_TOKENS_INDEX, 'identifier', query, async (items) => {
        hasRarities = items.length === 1 ? items[0].nft_hasRarities || false : undefined;
        return undefined;
      });
    } catch (error) {
      this.logger.error(`Error when getting collection rarity flag`, {
        path: 'NftRarityService.getCollectionRarityFlag',
        exception: error?.message,
        collection: collectionTicker,
      });
      return false;
    }

    return hasRarities;
  }

  async getAllCollectionNftsFromElastic(collectionTicker: string): Promise<NftRarityData[]> {
    let nfts: NftRarityData[] = [];

    try {
      const query = ElasticQuery.create()
        .withMustExistCondition('nonce')
        .withMustCondition(QueryType.Match('token', collectionTicker, QueryOperator.AND))
        .withMustCondition(QueryType.Nested('data', [new MatchQuery('data.nonEmptyURIs', true )]))
        // TODO(whiteListedStorage)
        // .withMustCondition(
        //   QueryType.Nested('data', { 'data.whiteListedStorage': true }),
        // )
        .withFields([
          'nonce',
          ELASTIC_NFT_HASRARITY,
          ELASTIC_NFT_RANK_CUSTOM,
          ELASTIC_NFT_SCORE_OPENRARITY,
          ELASTIC_NFT_RANK_OPENRARITY,
          ELASTIC_NFT_SCORE_JACCARD,
          ELASTIC_NFT_RANK_JACCARD,
          ELASTIC_NFT_SCORE_TRAIT,
          ELASTIC_NFT_RANK_TRAIT,
          ELASTIC_NFT_SCORE_STATISTICAL,
          ELASTIC_NFT_RANK_STATISTICAL,
        ])
        .withMustMultiShouldCondition([NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT], (type) => QueryType.Match('type', type))
        .withSort([{ name: 'nonce', order: ElasticSortOrder.descending }])
        .withPagination({
          from: 0,
          size: constants.getNftsFromElasticBatchSize,
        });

      await this.elasticService.getScrollableList(ELASTIC_TOKENS_INDEX, 'identifier', query, async (newNfts) => {
        nfts = nfts.concat(NftRarityData.fromElasticNfts(newNfts));
        return undefined;
      });
    } catch (error) {
      this.logger.error(`Error when getting all collection NFTs from Elastic`, {
        path: 'NftRarityService.getAllCollectionNftsFromElastic',
        exception: error?.message,
        collection: collectionTicker,
      });
      return [];
    }

    return nfts;
  }

  async setElasticRarityMappings(): Promise<void> {
    if (process.env.ENABLE_ELASTIC_UPDATES === 'true') {
      await Locker.lock(
        'setElasticRarityMappings',
        async () => {
          try {
            await this.elasticService.putMappings(
              ELASTIC_TOKENS_INDEX,
              this.elasticService.buildPutMultipleMappingsBody([
                {
                  key: ELASTIC_NFT_RANK_CUSTOM,
                  value: 'long',
                },
                {
                  key: ELASTIC_NFT_RANK_HASH,
                  value: 'text',
                },
                {
                  key: ELASTIC_NFT_SCORE_OPENRARITY,
                  value: 'float',
                },
                {
                  key: ELASTIC_NFT_RANK_OPENRARITY,
                  value: 'long',
                },
                {
                  key: ELASTIC_NFT_SCORE_JACCARD,
                  value: 'float',
                },
                {
                  key: ELASTIC_NFT_RANK_JACCARD,
                  value: 'long',
                },
                {
                  key: ELASTIC_NFT_SCORE_TRAIT,
                  value: 'float',
                },
                {
                  key: ELASTIC_NFT_RANK_TRAIT,
                  value: 'long',
                },
                {
                  key: ELASTIC_NFT_SCORE_STATISTICAL,
                  value: 'float',
                },
                {
                  key: ELASTIC_NFT_RANK_STATISTICAL,
                  value: 'long',
                },
              ]),
            );
          } catch (error) {
            this.logger.error('Error when trying to map Elastic types for rarity variables', {
              path: `${NftRarityElasticService.name}.${this.setElasticRarityMappings.name}`,
            });
          }
        },
        false,
      );
    }
  }

  async getAllCollectionsFromElastic(): Promise<string[]> {
    const query = this.getAllCollectionsFromElasticQuery();
    let collections: string[] = [];
    await this.elasticService.getScrollableList(ELASTIC_TOKENS_INDEX, 'token', query, async (items) => {
      collections = collections.concat([...new Set(items.map((i) => i.token))]);
    });
    return collections;
  }

  async getAllCollectionsWithRarityFlagsFromElastic(): Promise<CollectionFromElastic[]> {
    const query = this.getAllCollectionsWithRarityFlagsFromElasticQuery();
    let collections: CollectionFromElastic[] = [];
    await this.elasticService.getScrollableList(ELASTIC_TOKENS_INDEX, 'token', query, async (items) => {
      const collectionsWithRarityFlags = items.map((collection) => CollectionFromElastic.fromElastic(collection));
      collections = collections.concat([...new Set(collectionsWithRarityFlags)]);
    });
    return collections;
  }

  buildNftRaritiesBulkUpdate(nfts: NftRarityData[], hasRarities: boolean = true): string[] {
    let updates: string[] = [];
    nfts.forEach((r) => {
      if (hasRarities) {
        if (r.rarities.customRank) {
          updates.push(
            this.elasticService.buildBulkUpdate<number>(ELASTIC_TOKENS_INDEX, r.identifier, ELASTIC_NFT_RANK_CUSTOM, r.rarities.customRank),
          );
        }
        updates.push(
          this.elasticService.buildBulkUpdate<number>(
            ELASTIC_TOKENS_INDEX,
            r.identifier,
            ELASTIC_NFT_SCORE_OPENRARITY,
            r.rarities.openRarityScore,
          ),
        );
        updates.push(
          this.elasticService.buildBulkUpdate<number>(
            ELASTIC_TOKENS_INDEX,
            r.identifier,
            ELASTIC_NFT_RANK_OPENRARITY,
            r.rarities.openRarityRank,
          ),
        );
        updates.push(
          this.elasticService.buildBulkUpdate<number>(
            ELASTIC_TOKENS_INDEX,
            r.identifier,
            ELASTIC_NFT_SCORE_JACCARD,
            r.rarities.jaccardDistancesScore,
          ),
        );
        updates.push(
          this.elasticService.buildBulkUpdate<number>(
            ELASTIC_TOKENS_INDEX,
            r.identifier,
            ELASTIC_NFT_RANK_JACCARD,
            r.rarities.jaccardDistancesRank,
          ),
        );
        updates.push(
          this.elasticService.buildBulkUpdate<number>(ELASTIC_TOKENS_INDEX, r.identifier, ELASTIC_NFT_SCORE_TRAIT, r.rarities.traitScore),
        );
        updates.push(
          this.elasticService.buildBulkUpdate<number>(ELASTIC_TOKENS_INDEX, r.identifier, ELASTIC_NFT_RANK_TRAIT, r.rarities.traitRank),
        );
        updates.push(
          this.elasticService.buildBulkUpdate<number>(
            ELASTIC_TOKENS_INDEX,
            r.identifier,
            ELASTIC_NFT_SCORE_STATISTICAL,
            r.rarities.statisticalScore,
          ),
        );
        updates.push(
          this.elasticService.buildBulkUpdate<number>(
            ELASTIC_TOKENS_INDEX,
            r.identifier,
            ELASTIC_NFT_RANK_STATISTICAL,
            r.rarities.statisticalRank,
          ),
        );
      }
      updates.push(this.elasticService.buildBulkUpdate<boolean>(ELASTIC_TOKENS_INDEX, r.identifier, ELASTIC_NFT_HASRARITY, hasRarities));
    });
    return updates;
  }

  buildNftCustomRanksBulkUpdate(collection, customRanks: CustomRank[]): string[] {
    let updates: string[] = [];
    customRanks.forEach((cr) => {
      updates.push(this.elasticService.buildBulkUpdate<number>(ELASTIC_TOKENS_INDEX, cr.identifier, ELASTIC_NFT_RANK_CUSTOM, cr.rank));
    });
    updates.push(
      this.elasticService.buildBulkUpdate<string>(
        ELASTIC_TOKENS_INDEX,
        collection,
        ELASTIC_NFT_RANK_HASH,
        CustomRank.generateHash(customRanks),
      ),
    );
    return updates;
  }

  getAllCollectionsFromElasticQuery(): ElasticQuery {
    return ElasticQuery.create()
      .withMustExistCondition('token')
      .withMustNotExistCondition('nonce')
      .withMustMultiShouldCondition([NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT], (type) => QueryType.Match('type', type))
      .withFields(['token'])
      .withPagination({
        from: 0,
        size: constants.getCollectionsFromElasticBatchSize,
      });
  }

  getAllCollectionsWithRarityFlagsFromElasticQuery(): ElasticQuery {
    return ElasticQuery.create()
      .withMustExistCondition('token')
      .withMustNotExistCondition('nonce')
      .withMustMultiShouldCondition([NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT], (type) => QueryType.Match('type', type))
      .withFields(['token', 'nft_hasRarities'])
      .withPagination({
        from: 0,
        size: constants.getCollectionsFromElasticBatchSize,
      });
  }

  getAllNftsWhereRarityNotComputedFromElasticQuery(): ElasticQuery {
    return ElasticQuery.create()
      .withMustExistCondition('nonce')
      .withMustNotCondition(QueryType.Exists(ELASTIC_NFT_HASRARITY))
      .withMustCondition(QueryType.Nested('data', [new MatchQuery('data.nonEmptyURIs', true )]))
      .withMustMultiShouldCondition([NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT], (type) => QueryType.Match('type', type))
      .withFields(['token'])
      .withPagination({
        from: 0,
        size: constants.getNftsFromElasticBatchSize,
      });
    // TODO(whiteListedStorage)
    // .withMustCondition(
    //   QueryType.Nested('data', { 'data.whiteListedStorage': true }),
    // )
  }
}

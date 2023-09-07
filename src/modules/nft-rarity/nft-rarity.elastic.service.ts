import { Injectable, Logger } from '@nestjs/common';
import { MxElasticService } from 'src/common';
import { ElasticQuery, ElasticSortOrder, Locker, QueryOperator, QueryType } from '@multiversx/sdk-nestjs';
import { NftTypeEnum } from '../assets/models';
import { NftRarityData } from './models/nft-rarity-data.model';
import { constants } from 'src/config';
import { CustomRank } from './models/custom-rank.model';
import { CollectionFromElastic } from './models/collection-from-elastic.model';
import { Rarity } from '../assets/models/Rarity';

@Injectable()
export class NftRarityElasticService {
  constructor(private readonly elasticService: MxElasticService, private readonly logger: Logger) {}

  async setCollectionRarityFlagInElastic(collection: string, hasRarities: boolean, currentFlagValue?: boolean): Promise<void> {
    if (hasRarities === currentFlagValue) {
      return;
    }

    try {
      const updateBody = this.elasticService.buildUpdateBody<boolean>('nft_hasRarities', hasRarities);
      await this.elasticService.setCustomValue('tokens', collection, updateBody, '?retry_on_conflict=2&timeout=1m');
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
      await this.elasticService.bulkRequest('tokens', this.buildNftRaritiesBulkUpdate(outdatedNfts, hasRarities), '?timeout=1m');
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
        await this.elasticService.bulkRequest('tokens', this.buildNftCustomRanksBulkUpdate(collection, outdatedRanks), '?timeout=1m');
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
        .withFields(['nft_custom_ranks_hash'])
        .withPagination({
          from: 0,
          size: 1,
        });

      await this.elasticService.getScrollableList('tokens', 'identifier', query, async (items) => {
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

      await this.elasticService.getScrollableList('tokens', 'identifier', query, async (items) => {
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
        .withMustCondition(QueryType.Nested('data', { 'data.nonEmptyURIs': true }))
        // TODO(whiteListedStorage)
        // .withMustCondition(
        //   QueryType.Nested('data', { 'data.whiteListedStorage': true }),
        // )
        .withFields([
          'nonce',
          'nft_hasRarity',
          'nft_rank_custom',
          'nft_score_openRarity',
          'nft_rank_openRarity',
          'nft_score_jaccardDistances',
          'nft_rank_jaccardDistances',
          'nft_score_trait',
          'nft_rank_trait',
          'nft_score_statistical',
          'nft_rank_statistical',
        ])
        .withMustMultiShouldCondition([NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT], (type) => QueryType.Match('type', type))
        .withSort([{ name: 'nonce', order: ElasticSortOrder.descending }])
        .withPagination({
          from: 0,
          size: constants.getNftsFromElasticBatchSize,
        });

      await this.elasticService.getScrollableList('tokens', 'identifier', query, async (newNfts) => {
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
              'tokens',
              this.elasticService.buildPutMultipleMappingsBody([
                {
                  key: 'nft_rank_custom',
                  value: 'long',
                },
                {
                  key: 'nft_custom_ranks_hash',
                  value: 'text',
                },
                {
                  key: 'nft_score_openRarity',
                  value: 'float',
                },
                {
                  key: 'nft_rank_openRarity',
                  value: 'long',
                },
                {
                  key: 'nft_score_jaccardDistances',
                  value: 'float',
                },
                {
                  key: 'nft_rank_jaccardDistances',
                  value: 'long',
                },
                {
                  key: 'nft_score_trait',
                  value: 'float',
                },
                {
                  key: 'nft_rank_trait',
                  value: 'long',
                },
                {
                  key: 'nft_score_statistical',
                  value: 'float',
                },
                {
                  key: 'nft_rank_statistical',
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
    await this.elasticService.getScrollableList('tokens', 'token', query, async (items) => {
      collections = collections.concat([...new Set(items.map((i) => i.token))]);
    });
    return collections;
  }

  async getAllCollectionsWithRarityFlagsFromElastic(): Promise<CollectionFromElastic[]> {
    const query = this.getAllCollectionsWithRarityFlagsFromElasticQuery();
    let collections: CollectionFromElastic[] = [];
    await this.elasticService.getScrollableList('tokens', 'token', query, async (items) => {
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
          updates.push(this.elasticService.buildBulkUpdate<number>('tokens', r.identifier, 'nft_rank_custom', r.rarities.customRank));
        }
        updates.push(
          this.elasticService.buildBulkUpdate<number>('tokens', r.identifier, 'nft_score_openRarity', r.rarities.openRarityScore),
        );
        updates.push(this.elasticService.buildBulkUpdate<number>('tokens', r.identifier, 'nft_rank_openRarity', r.rarities.openRarityRank));
        updates.push(
          this.elasticService.buildBulkUpdate<number>(
            'tokens',
            r.identifier,
            'nft_score_jaccardDistances',
            r.rarities.jaccardDistancesScore,
          ),
        );
        updates.push(
          this.elasticService.buildBulkUpdate<number>('tokens', r.identifier, 'nft_rank_jaccardDistances', r.rarities.jaccardDistancesRank),
        );
        updates.push(this.elasticService.buildBulkUpdate<number>('tokens', r.identifier, 'nft_score_trait', r.rarities.traitScore));
        updates.push(this.elasticService.buildBulkUpdate<number>('tokens', r.identifier, 'nft_rank_trait', r.rarities.traitRank));
        updates.push(
          this.elasticService.buildBulkUpdate<number>('tokens', r.identifier, 'nft_score_statistical', r.rarities.statisticalScore),
        );
        updates.push(
          this.elasticService.buildBulkUpdate<number>('tokens', r.identifier, 'nft_rank_statistical', r.rarities.statisticalRank),
        );
      }
      updates.push(this.elasticService.buildBulkUpdate<boolean>('tokens', r.identifier, 'nft_hasRarity', hasRarities));
    });
    return updates;
  }

  buildNftCustomRanksBulkUpdate(collection, customRanks: CustomRank[]): string[] {
    let updates: string[] = [];
    customRanks.forEach((cr) => {
      updates.push(this.elasticService.buildBulkUpdate<number>('tokens', cr.identifier, 'nft_rank_custom', cr.rank));
    });
    updates.push(
      this.elasticService.buildBulkUpdate<string>('tokens', collection, 'nft_custom_ranks_hash', CustomRank.generateHash(customRanks)),
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
      .withMustNotCondition(QueryType.Exists('nft_hasRarity'))
      .withMustCondition(QueryType.Nested('data', { 'data.nonEmptyURIs': true }))
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

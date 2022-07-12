import { Inject, Injectable } from '@nestjs/common';
import { ElrondApiService, ElrondElasticService, Nft } from 'src/common';
import { AssetsQuery, AssetsRedisHandler } from 'src/modules/assets';
import { NftRarityComputeService } from './nft-rarity.compute.service';
import { NftRarityEntity } from '../../db/nft-rarity/nft-rarity.entity';
import { NftRarityRepository } from '../../db/nft-rarity/nft-rarity.repository';
import { DeleteResult } from 'typeorm';
import { Logger } from 'winston';
import { NftRarityChecksum } from './nft-rarity-checksum.model';
import { ElasticQuery, QueryOperator, QueryType } from '@elrondnetwork/erdnest';
import BigNumber from 'bignumber.js';
import { NftTypeEnum } from '../assets/models';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { AssetRarityInfoRedisHandler } from '../assets/loaders/assets-rarity-info.redis-handler';

@Injectable()
export class NftRarityService {
  constructor(
    private readonly apiService: ElrondApiService,
    private readonly elasticService: ElrondElasticService,
    private readonly nftRarityRepository: NftRarityRepository,
    private readonly nftRarityComputeService: NftRarityComputeService,
    private readonly assetRarityRedisHandler: AssetRarityInfoRedisHandler,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async updateRarities(
    collectionTicker: string,
    skipIfRaritiesFlag = false,
  ): Promise<boolean> {
    const [allNfts, raritiesFlag] = await Promise.all([
      this.getAllCollectionNftsFromAPI(collectionTicker),
      this.getCollectionRarityFlag(collectionTicker),
    ]);

    if (raritiesFlag === undefined) {
      this.logger.error(`Wrong collection ID`, {
        path: 'NftRarityService.updateRarities',
        collection: collectionTicker,
      });
      return false;
    }

    if (!raritiesFlag && skipIfRaritiesFlag) {
      this.logger.info(
        `Update rarities process skipped because rarities flag === true & skipIfRaritiesFlag === true`,
        {
          path: 'NftRarityService.updateRarities',
          collection: collectionTicker,
        },
      );
      return false;
    }

    if (allNfts?.length === 0) {
      this.logger.info(
        'No NFTs -> set rarities & nft_attributes flags to false & return false',
        {
          path: 'NftRarityService.updateRarities',
          collection: collectionTicker,
        },
      );
      await this.setCollectionRarityFlagInElastic(collectionTicker, false);
      return false;
    }

    const nfts = this.filterNftsWithAttributes(allNfts);

    if (allNfts.length !== nfts.length) {
      this.logger.info(
        `The elrond api has not indexed attributes for ${
          allNfts.length - nfts.length
        }/${allNfts.length} nft(s)`,
        {
          path: 'NftRarityService.updateRarities',
          collection: collectionTicker,
        },
      );
    }

    if (nfts?.length === 0) {
      this.logger.info(
        'Collection has no attributes or attributes were not indexed yet by the elrond api',
        {
          path: 'NftRarityService.updateRarities',
          collection: collectionTicker,
        },
      );
      await Promise.all([
        this.setCollectionRarityFlagInElastic(collectionTicker, false),
        this.setNftRaritiesInElastic(allNfts, false),
      ]);
      return false;
    }

    let rarities: NftRarityEntity[] = await this.computeRarities(
      nfts,
      collectionTicker,
    );

    if (!rarities) {
      this.logger.error(`No rarities were computed`, {
        path: 'NftRarityService.updateRarities',
        collection: collectionTicker,
      });
      return false;
    }

    try {
      await Promise.all([
        this.nftRarityRepository.saveOrUpdateBulk(rarities),
        this.setCollectionRarityFlagInElastic(collectionTicker, true),
        this.setNftRaritiesInElastic(rarities),
        this.assetRarityRedisHandler.clearMultipleKeys(
          rarities.map((r) => r.identifier),
        ),
      ]);
    } catch (error) {
      this.logger.error(`Error when updating DB, Elastic or clearing cache`, {
        path: 'NftRarityService.updateRarities',
        exception: error?.message,
        collection: collectionTicker,
      });
      return false;
    }

    return true;
  }

  private async computeRarities(nfts: Nft[], collectionTicker: string) {
    let rarities: NftRarityEntity[] = [];

    try {
      rarities =
        await this.nftRarityComputeService.computeJaccardDistancesRarities(
          this.sortAscNftsByNonce(nfts),
        );
    } catch (error) {
      this.logger.error(`Error when computing JD rarities`, {
        path: 'NftRarityService.updateRarities',
        exception: error?.message,
        collection: collectionTicker,
      });
    }
    return rarities;
  }

  async validateRarities(collectionTicker: string): Promise<boolean> {
    const [elasticNfts, dbNfts] = await Promise.all([
      this.getAllCollectionNftsFromElastic(collectionTicker),
      this.nftRarityRepository.find({
        collection: collectionTicker,
      }),
    ]);

    const [elasticChecksum, dbChecksum] = await Promise.all([
      this.getNftRarityChecksum(elasticNfts),
      this.getNftRarityChecksum(dbNfts),
    ]);

    if (
      !this.isIdenticalChecksum(
        elasticNfts,
        dbNfts,
        elasticChecksum,
        dbChecksum,
      )
    ) {
      try {
        await this.migrateOrRecalculateRarities(
          collectionTicker,
          elasticChecksum,
          dbChecksum,
          dbNfts,
        );
      } catch (error) {
        this.logger.error(
          'Error when migrating/recalculating collection rarities',
          {
            path: 'NftRarityService.updateRarities',
            exception: error?.message,
            collection: collectionTicker,
          },
        );
      }
    }

    return true;
  }

  private async migrateOrRecalculateRarities(
    collectionTicker: string,
    elasticChecksum: NftRarityChecksum,
    dbChecksum: NftRarityChecksum,
    dbNfts: NftRarityEntity[],
  ): Promise<void> {
    if (
      dbChecksum.score.isGreaterThan(elasticChecksum.score) ||
      dbChecksum.rank.isGreaterThan(elasticChecksum.rank)
    ) {
      this.logger.info(
        `validateRarities(${collectionTicker}): collection wrong checksum -> migrate rarities from DB -> Elastic`,
        {
          path: 'NftRarityService.migrateOrRecalculateCollection',
          collection: collectionTicker,
        },
      );
      await Promise.all([
        this.setCollectionRarityFlagInElastic(collectionTicker, true),
        this.setNftRaritiesInElastic(dbNfts),
      ]);
    } else {
      this.logger.info(
        `validateRarities(${collectionTicker}): collection wrong checksum -> recalculate rarities using updateRarities`,
        {
          path: 'NftRarityService.migrateOrRecalculateCollection',
          collection: collectionTicker,
        },
      );
      await this.updateRarities(collectionTicker);
    }
  }

  isIdenticalChecksum(
    elasticNfts: Nft[],
    dbNfts: NftRarityEntity[],
    checksumA: NftRarityChecksum,
    checksumB: NftRarityChecksum,
  ): boolean {
    if (
      elasticNfts.length === 0 ||
      dbNfts.length === 0 ||
      checksumA.score.toString() !== checksumB.score.toString() ||
      checksumA.rank.toString() !== checksumB.rank.toString() ||
      checksumA.rank.isEqualTo(0) ||
      checksumA.score.isEqualTo(0)
    )
      return false;
    return true;
  }

  async deleteNftRarity(identifier: string): Promise<DeleteResult> {
    return await this.nftRarityRepository.delete({ identifier: identifier });
  }

  async getNftRarityChecksum(
    nfts: Nft[] | NftRarityEntity[],
  ): Promise<NftRarityChecksum> {
    let checksum = new NftRarityChecksum({
      score: new BigNumber(0),
      rank: new BigNumber(0),
    });

    nfts.map((r) => {
      checksum.score = new BigNumber(r.score || r.nft_rarity_score || 0).plus(
        checksum.score,
      );
      checksum.rank = new BigNumber(r.rank || r.nft_rarity_rank || 0).plus(
        checksum.rank,
      );
    });

    return checksum;
  }

  buildNftRaritiesBulkUpdate(
    nfts: NftRarityEntity[] | Nft[],
    hasRarities: boolean = true,
  ): string {
    let updates: string = '';
    nfts.forEach((r) => {
      if (hasRarities) {
        updates += this.elasticService.buildBulkUpdateBody<number>(
          'tokens',
          r.identifier,
          'nft_rarity_score',
          r.score || r.nft_rarity_score || 0,
        );
        updates += this.elasticService.buildBulkUpdateBody<number>(
          'tokens',
          r.identifier,
          'nft_rarity_rank',
          r.rank || r.nft_rarity_rank,
        );
      }
      updates += this.elasticService.buildBulkUpdateBody<boolean>(
        'tokens',
        r.identifier,
        'nft_hasRarity',
        hasRarities,
      );
    });
    return updates;
  }

  async setCollectionRarityFlagInElastic(
    collection: string,
    hasRarities: boolean,
  ): Promise<void> {
    try {
      const updateBody = this.elasticService.buildUpdateBody<boolean>(
        'nft_hasRarities',
        hasRarities,
      );
      await this.elasticService.setCustomValue(
        'tokens',
        collection,
        updateBody,
        '?retry_on_conflict=2&timeout=5m',
      );
    } catch (error) {
      this.logger.error('Error when setting collection rarity flag', {
        path: 'NftRarityService.updateRarities',
        exception: error?.message,
        collection: collection,
      });
    }
  }

  async setNftRaritiesInElastic(
    nfts: NftRarityEntity[] | Nft[],
    hasRarities: boolean = true,
  ): Promise<void> {
    if (nfts.length > 0) {
      try {
        await this.elasticService.bulkRequest(
          'tokens',
          this.buildNftRaritiesBulkUpdate(nfts, hasRarities),
          '?timeout=5m',
        );
      } catch (error) {
        this.logger.error('Error when mapping / bulk updating Elastic', {
          path: 'NftRarityService.setNftRaritiesInElastic',
          exception: error?.message,
        });
      }
    }
  }

  async getCollectionRarityFlag(collectionTicker: string): Promise<boolean> {
    let hasRarities: boolean;

    try {
      const query = ElasticQuery.create()
        .withMustNotExistCondition('nonce')
        .withMustExistCondition('token')
        .withMustMultiShouldCondition(
          [NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT],
          (type) => QueryType.Match('type', type),
        )
        .withMustCondition(
          QueryType.Match('token', collectionTicker, QueryOperator.AND),
        )
        .withPagination({ from: 0, size: 10000 });

      await this.elasticService.getScrollableList(
        'tokens',
        'identifier',
        query,
        async (items) => {
          hasRarities =
            items.length > 0 ? items[0].rarities || false : undefined;
          return;
        },
      );
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

  private async getAllCollectionNftsFromAPI(
    collectionTicker: string,
  ): Promise<Nft[]> {
    try {
      const query = new AssetsQuery().addPageSize(0, 10000).build();
      return await this.apiService.getAllCollectionNftsForQuery(
        collectionTicker,
        query,
      );
    } catch (error) {
      this.logger.error(`Error when getting all collection NFTs from API`, {
        path: 'NftRarityService.getAllCollectionNftsFromAPI',
        exception: error?.message,
        collection: collectionTicker,
      });
      return [];
    }
  }

  private async getAllCollectionNftsFromElastic(
    collectionTicker: string,
  ): Promise<Nft[]> {
    let nfts: Nft[] = [];

    try {
      const query = ElasticQuery.create()
        .withMustExistCondition('identifier')
        .withMustCondition(
          QueryType.Match('token', collectionTicker, QueryOperator.AND),
        )
        .withFields(['nft_rarity_score', 'nft_rarity_rank', 'nonce'])
        .withPagination({ from: 0, size: 10000 });

      await this.elasticService.getScrollableList(
        'tokens',
        'identifier',
        query,
        async (items) => {
          nfts = nfts.concat(items);
        },
      );
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

  private filterNftsWithAttributes(nfts: Nft[]): Nft[] {
    return nfts.filter((nft) => nft.metadata?.attributes !== undefined);
  }

  private sortAscNftsByNonce(nfts: Nft[]): Nft[] {
    return [...nfts].sort(function (a, b) {
      return b.nonce - a.nonce;
    });
  }
}

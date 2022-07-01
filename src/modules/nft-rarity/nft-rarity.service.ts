import { Inject, Injectable } from '@nestjs/common';
import { ElrondApiService, ElrondElasticService, Nft } from 'src/common';
import { AssetsQuery } from 'src/modules/assets';
import { NftRarityComputeService } from './nft-rarity.compute.service';
import { NftRarityEntity } from '../../db/nft-rarity/nft-rarity.entity';
import { NftRarityRepository } from '../../db/nft-rarity/nft-rarity.repository';
import { DeleteResult } from 'typeorm';
import { Logger } from 'winston';
import { NftRarityChecksum } from './nft-rarity-checksum.model';
import { ElasticQuery, QueryOperator, QueryType } from '@elrondnetwork/erdnest';
import BigNumber from 'bignumber.js';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { NftTypeEnum } from '../assets/models';

@Injectable()
export class NftRarityService {
  constructor(
    private readonly apiService: ElrondApiService,
    private readonly elasticService: ElrondElasticService,
    private readonly nftRarityRepository: NftRarityRepository,
    private readonly nftRarityComputeService: NftRarityComputeService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async updateRarities(
    collectionTicker: string,
    skipIfNoRaritiesFlag = false,
  ): Promise<boolean> {
    const [nfts, raritiesFlag] = await Promise.all([
      this.getAllCollectionNftsFromAPI(collectionTicker),
      this.getCollectionRarityFlag(collectionTicker),
    ]);

    if ((!raritiesFlag && skipIfNoRaritiesFlag) || nfts?.length === 0) {
      this.logger.debug(
        `updateRarities(${collectionTicker}): ${
          nfts.length === 0
            ? 'No NFTs'
            : 'skipped because no rarities flag || rarities flag === false'
        } -> set rarities & nft_attributes flags to false & return false`,
      );
      await Promise.all([
        this.setCollectionRarityFlag(collectionTicker, false),
        this.setNftRarityFlags(nfts, false),
      ]);
      return false;
    }

    if (
      nfts?.find((nft) => nft.metadata?.attributes === null) ||
      nfts?.find((nft) => nft.metadata?.attributes === undefined)
    ) {
      this.logger.debug(
        `updateRarities(${collectionTicker}): collection has no attributes -> set rarities & nft_attributes flags to false & return false`,
      );
      await Promise.all([
        this.setCollectionRarityFlag(collectionTicker, false),
        this.setNftRarityFlags(nfts, false),
      ]);
      return false;
    }

    let rarities: NftRarityEntity[] = [];

    try {
      rarities =
        await this.nftRarityComputeService.computeJaccardDistancesRarities(
          this.sortAscNftsByNonce(nfts),
        );
    } catch (error) {
      this.logger.error(`updateRarities(${collectionTicker}) ERROR: ${error}`);
    }

    console;

    if (!rarities) {
      this.logger.error(
        `updateRarities(${collectionTicker}): no rarities were computed.`,
      );
      return false;
    }

    try {
      await Promise.all([
        this.nftRarityRepository.saveOrUpdateBulk(rarities),
        this.setCollectionRarityFlag(collectionTicker, true),
        this.setNftRarityFlags(rarities),
      ]);
    } catch (error) {
      this.logger.error(
        `updateRarities(${collectionTicker}) ERROR when updating DB || Elastic: ${error}`,
      );
      return false;
    }

    return true;
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
      if (elasticNfts[0]?.['nft_hasRarity'] === true) {
        this.logger.debug(
          `validateRarities(${collectionTicker}): collection wrong checksum -> updateRarities`,
        );
      }
      console.log('Wtf');
      await this.updateRarities(collectionTicker);
    }

    return true;
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
      checksum.score = new BigNumber(r.score | r.nft_score).plus(
        checksum.score,
      );
      checksum.rank = new BigNumber(r.rank | r.nft_rank).plus(checksum.rank);
    });

    return checksum;
  }

  buildRaritiesBulkUpdate(
    nfts: NftRarityEntity[] | Nft[],
    hasRarities: boolean = true,
  ): string {
    let updates: string = '';
    nfts.forEach((r) => {
      if (hasRarities) {
        updates += this.elasticService.buildBulkUpdateBody(
          'tokens',
          r.identifier,
          'nft_score',
          r.score | r.nft_score,
        );
        updates += this.elasticService.buildBulkUpdateBody(
          'tokens',
          r.identifier,
          'nft_rank',
          r.rank | r.nft_rank,
        );
      }
      updates += this.elasticService.buildBulkUpdateBody(
        'tokens',
        r.identifier,
        'nft_hasRarity',
        hasRarities,
      );
    });
    return updates;
  }

  async setCollectionRarityFlag(
    collection: string,
    hasRarities: boolean,
  ): Promise<void> {
    try {
      const updateBody = this.elasticService.buildUpdateBody(
        'rarities',
        hasRarities,
      );
      await this.elasticService.setCustomValue(
        'tokens',
        collection,
        updateBody,
      );
    } catch (error) {
      this.logger.error(
        `setCollectionRarityFlag(${collection}, ${hasRarities})`,
      );
      throw error;
    }
  }

  async setNftRarityFlags(
    nfts: NftRarityEntity[] | Nft[],
    hasRarities: boolean = true,
  ): Promise<void> {
    if (nfts.length > 0)
      this.elasticService.bulkRequest(
        'tokens',
        this.buildRaritiesBulkUpdate(nfts, hasRarities),
      );
  }

  async getCollectionRarityFlag(collectionTicker: string): Promise<boolean> {
    let hasRarities = false;

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
          hasRarities = items[0].rarities || false;
          return;
        },
      );
    } catch (error) {
      this.logger.error(`itHasRarities(${collectionTicker})`);
      return false;
    }

    return hasRarities;
  }

  private async getAllCollectionNftsFromAPI(
    collectionTicker: string,
  ): Promise<Nft[]> {
    try {
      return await this.apiService.getAllNfts(
        new AssetsQuery()
          .addCollection(collectionTicker)
          .addPageSize(0, 10000)
          .build(),
      );
    } catch (error) {
      this.logger.error(`getAllCollectionNftsFromAPI(${collectionTicker})`);
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
        .withFields(['nft_score', 'nft_rank'])
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
      this.logger.error(`getAllCollectionNftsFromElastic(${collectionTicker})`);
      return [];
    }

    return nfts;
  }

  private sortAscNftsByNonce(nfts: Nft[]): Nft[] {
    return [...nfts].sort(function (a, b) {
      return b.nonce - a.nonce;
    });
  }
}

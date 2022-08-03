import { Injectable, Logger } from '@nestjs/common';
import { ElrondApiService, ElrondElasticService, Nft } from 'src/common';
import { AssetsQuery } from 'src/modules/assets';
import { NftRarityComputeService } from './nft-rarity.compute.service';
import { NftRarityEntity } from '../../db/nft-rarity/nft-rarity.entity';
import { NftRarityRepository } from '../../db/nft-rarity/nft-rarity.repository';
import { DeleteResult } from 'typeorm';
import { NftRarityChecksum } from './nft-rarity-checksum.model';
import { ElasticQuery, QueryOperator, QueryType } from '@elrondnetwork/erdnest';
import { NftTypeEnum } from '../assets/models';
import { AssetRarityInfoRedisHandler } from '../assets/loaders/assets-rarity-info.redis-handler';
import { ElrondPrivateApiService } from 'src/common/services/elrond-communication/elrond-private-api.service';
import { NftRarityData } from './nft-rarity-data.model';

@Injectable()
export class NftRarityService {
  constructor(
    private readonly apiService: ElrondApiService,
    private readonly privateApiService: ElrondPrivateApiService,
    private readonly elasticService: ElrondElasticService,
    private readonly nftRarityRepository: NftRarityRepository,
    private readonly nftRarityComputeService: NftRarityComputeService,
    private readonly assetRarityRedisHandler: AssetRarityInfoRedisHandler,
    private readonly logger: Logger,
  ) {
    //this.setElasticRarityMappings();
  }

  async validateRarities(collectionTicker: string): Promise<boolean> {
    const [elasticNfts, dbNfts] = await Promise.all([
      this.getAllCollectionNftsFromElastic(collectionTicker),
      this.nftRarityRepository.find({
        collection: collectionTicker,
      }),
    ]);

    console.log(elasticNfts[0]);

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
      this.logger.log(
        `Update rarities process skipped because rarities flag === true & skipIfRaritiesFlag === true`,
        {
          path: 'NftRarityService.updateRarities',
          collection: collectionTicker,
        },
      );
      return false;
    }

    if (allNfts?.length === 0) {
      const nftsFromElastic = await this.getAllCollectionNftsFromElastic(
        collectionTicker,
      );

      const reason: string =
        nftsFromElastic.length === 0
          ? 'No NFTs'
          : 'Not valid NFT (bad metadata storage or/and URIs)';
      this.logger.log(
        `${reason} -> set nft_hasRaries & nft_hasRarity flags to false & return false`,
        {
          path: 'NftRarityService.updateRarities',
          collection: collectionTicker,
        },
      );

      await Promise.all([
        this.setCollectionRarityFlagInElastic(collectionTicker, false),
        this.setNftRaritiesInElastic(nftsFromElastic, false),
      ]);
      return false;
    }

    let nftsWithAttributes = this.filterNftsWithAttributes(allNfts);

    if (nftsWithAttributes?.length === 0) {
      this.logger.log(
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

    const nftsWithoutAttributes = this.filterNftsWithoutAttributes(allNfts);

    if (nftsWithoutAttributes.length > 0) {
      nftsWithAttributes = nftsWithAttributes.concat(
        await this.reprocessNftsMetadataAndSetFlags(
          collectionTicker,
          nftsWithoutAttributes,
          nftsWithAttributes.length,
        ),
      );
    }

    const rarities: NftRarityEntity[] = await this.computeRarities(
      nftsWithAttributes,
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

  async deleteNftRarity(identifier: string): Promise<DeleteResult> {
    return await this.nftRarityRepository.delete({ identifier: identifier });
  }

  private async computeRarities(
    nfts: NftRarityData[],
    collectionTicker: string,
  ) {
    let rarities: NftRarityEntity[] = [];
    try {
      rarities =
        await this.nftRarityComputeService.computeJaccardDistancesRarities(
          collectionTicker,
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

  private async migrateOrRecalculateRarities(
    collectionTicker: string,
    elasticChecksum: NftRarityChecksum,
    dbChecksum: NftRarityChecksum,
    dbNfts: NftRarityEntity[],
  ): Promise<void> {
    const customInfo = {
      path: 'NftRarityService.migrateOrRecalculateCollection',
      collection: collectionTicker,
      elasticScore: elasticChecksum.score,
      dbScore: dbChecksum.score,
      elasticRank: elasticChecksum.rank,
      dbRank: dbChecksum.rank,
    };

    if (
      dbChecksum.score > elasticChecksum.score ||
      dbChecksum.rank > elasticChecksum.rank
    ) {
      this.logger.log(
        `Collection rarity wrong checksum -> migrate rarities from DB -> Elastic`,
        customInfo,
      );
      console.log(customInfo);
      await Promise.all([
        this.setCollectionRarityFlagInElastic(collectionTicker, true),
        this.setNftRaritiesInElastic(dbNfts),
      ]);
    } else {
      this.logger.log(
        `Collection rarity wrong checksum -> recalculate rarities using updateRarities`,
        customInfo,
      );
      await this.updateRarities(collectionTicker);
    }
  }

  private isIdenticalChecksum(
    elasticNfts: NftRarityData[],
    dbNfts: NftRarityEntity[],
    checksumA: NftRarityChecksum,
    checksumB: NftRarityChecksum,
  ): boolean {
    if (
      elasticNfts.length === 0 ||
      dbNfts.length === 0 ||
      checksumA.rank === 0 ||
      checksumA.score === 0 ||
      checksumA.score !== checksumB.score ||
      checksumA.rank !== checksumB.rank
    ) {
      return false;
    }
    return true;
  }

  private async getNftRarityChecksum(
    nfts: NftRarityData[] | NftRarityEntity[],
  ): Promise<NftRarityChecksum> {
    let checksum = new NftRarityChecksum({
      score: 0,
      rank: 0,
    });

    nfts.map((r) => {
      checksum.score += parseFloat(r.score || r.nft_rarity_score || 0);
      checksum.rank += r.rank || r.nft_rarity_rank || 0;
    });

    return checksum;
  }

  private buildNftRaritiesBulkUpdate(
    nfts: NftRarityEntity[] | NftRarityData[],
    hasRarities: boolean = true,
  ): string[] {
    let updates: string[] = [];
    nfts.forEach((r) => {
      if (hasRarities) {
        updates.push(
          this.elasticService.buildBulkUpdate<number>(
            'tokens',
            r.identifier,
            'nft_rarity_score',
            r.score || r.nft_rarity_score || 0,
          ),
        );
        updates.push(
          this.elasticService.buildBulkUpdate<number>(
            'tokens',
            r.identifier,
            'nft_rarity_rank',
            r.rank || r.nft_rarity_rank,
          ),
        );
      }
      updates.push(
        this.elasticService.buildBulkUpdate<boolean>(
          'tokens',
          r.identifier,
          'nft_hasRarity',
          hasRarities,
        ),
      );
    });
    return updates;
  }

  private async setCollectionRarityFlagInElastic(
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
        '?retry_on_conflict=2&timeout=1m',
      );
    } catch (error) {
      this.logger.error('Error when setting collection rarity flag', {
        path: 'NftRarityService.updateRarities',
        exception: error?.message,
        collection: collection,
      });
    }
  }

  private async setNftRaritiesInElastic(
    nfts: NftRarityEntity[] | NftRarityData[],
    hasRarities: boolean = true,
  ): Promise<void> {
    if (nfts.length > 0) {
      try {
        await this.elasticService.bulkRequest(
          'tokens',
          this.buildNftRaritiesBulkUpdate(nfts, hasRarities),
          '?timeout=1m',
        );
      } catch (error) {
        this.logger.error('Error when bulk updating Elastic', {
          path: 'NftRarityService.setNftRaritiesInElastic',
          exception: error?.message,
        });
      }
    }
  }

  private async getCollectionRarityFlag(
    collectionTicker: string,
  ): Promise<boolean> {
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
        );

      await this.elasticService.getScrollableList(
        'tokens',
        'identifier',
        query,
        async (items) => {
          hasRarities =
            items.length === 1 ? items[0].nft_hasRarities || false : undefined;
          return undefined;
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
  ): Promise<NftRarityData[]> {
    try {
      const query = new AssetsQuery().addPageSize(0, 10000).build();
      const res = await this.apiService.getAllCollectionNftsForQuery(
        collectionTicker,
        query,
      );
      return res.map((nft) => NftRarityData.fromNft(nft));
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
  ): Promise<NftRarityData[]> {
    let nfts: NftRarityData[] = [];

    try {
      const query = ElasticQuery.create()
        .withMustExistCondition('nonce')
        .withMustCondition(
          QueryType.Match('token', collectionTicker, QueryOperator.AND),
        )
        .withMustCondition(
          QueryType.Nested('data', { 'data.nonEmptyURIs': true }),
        )
        .withMustCondition(
          QueryType.Nested('data', { 'data.whiteListedStorage': true }),
        )
        .withFields(['nft_rarity_score', 'nft_rarity_rank', 'nonce'])
        .withPagination({ from: 0, size: 10000 });

      await this.elasticService.getScrollableList(
        'tokens',
        'identifier',
        query,
        async (items) => {
          nfts = nfts.concat(
            items.map((nft) => NftRarityData.fromElasticNft(nft)),
          );
          return undefined;
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

  private async reprocessNftsMetadataAndSetFlags(
    collectionTicker: string,
    nftsWithoutAttributes: NftRarityData[],
    nftsWithAttributesCount: number = null,
  ): Promise<NftRarityData[]> {
    let successfullyProcessedNFTs: NftRarityData[] = [];

    try {
      let customInfo = {
        path: 'NftRarityService.reprocessNftsMetadataAndSetFlags',
        collection: collectionTicker,
        nftsFound: nftsWithAttributesCount,
        successfullyIndexed: 0,
        unsuccessfullyIndexed: 0,
      };

      for (const nft of nftsWithoutAttributes) {
        await this.privateApiService.processNft(nft.identifier);
        const processedNft = await this.apiService.getNftByIdentifier(
          nft.identifier,
        );
        if (processedNft?.metadata?.attributes !== undefined) {
          successfullyProcessedNFTs.push(processedNft);
        }
      }

      customInfo.successfullyIndexed = successfullyProcessedNFTs.length;

      const unsuccessfullyProcessedNfts = nftsWithoutAttributes.filter(
        (nft) => successfullyProcessedNFTs.indexOf(nft) === -1,
      );

      if (unsuccessfullyProcessedNfts.length > 0) {
        customInfo.unsuccessfullyIndexed = unsuccessfullyProcessedNfts.length;
        await this.setNftRaritiesInElastic(unsuccessfullyProcessedNfts, false);
      }

      this.logger.log(`Tried to reprocess NFT attributes`, customInfo);
    } catch (error) {
      this.logger.error(`Error when trying to reprocess collection metadata`, {
        path: 'NftRarityService.reprocessNftsMetadataAndSetFlags',
        exception: error?.message,
        collection: collectionTicker,
      });
    }

    return successfullyProcessedNFTs;
  }

  private filterNftsWithAttributes(nfts: NftRarityData[]): NftRarityData[] {
    return nfts.filter((nft) => nft.metadata?.attributes !== undefined);
  }

  private filterNftsWithoutAttributes(nfts: NftRarityData[]): NftRarityData[] {
    return nfts.filter(
      (nft) =>
        nft.metadata?.attributes === undefined ||
        nft.metadata?.attributes === null,
    );
  }

  private sortAscNftsByNonce(nfts: NftRarityData[]): NftRarityData[] {
    return [...nfts].sort(function (a, b) {
      return b.nonce - a.nonce;
    });
  }

  async setElasticRarityMappings(): Promise<void> {
    try {
      await this.elasticService.putMappings(
        'tokens',
        this.elasticService.buildPutMultipleMappingsBody([
          {
            key: 'nft_rarity_score',
            value: 'float',
          },
          {
            key: 'nft_rarity_rank',
            value: 'float',
          },
        ]),
      );
    } catch (error) {
      this.logger.error(
        'Error when trying to map Elastic types for rarity variables',
        {
          path: 'NftRarityService.setElasticRarityMappings',
        },
      );
    }
  }
}

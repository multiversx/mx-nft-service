import { Injectable } from '@nestjs/common';
import { ElrondApiService, ElrondElasticService, Nft } from 'src/common';
import { AssetsQuery } from 'src/modules/assets';
import { NftRarityComputeService } from './nft-rarity.compute.service';
import { NftRarityEntity } from '../../db/nft-rarity/nft-rarity.entity';
import { NftRarityRepository } from '../../db/nft-rarity/nft-rarity.repository';
import { DeleteResult } from 'typeorm';
import { NftRarityChecksum } from './nft-rarity-checksum.model';
import { ElasticQuery, QueryOperator, QueryType } from '@elrondnetwork/erdnest';
import BigNumber from 'bignumber.js';

@Injectable()
export class NftRarityService {
  constructor(
    private readonly apiService: ElrondApiService,
    private readonly elasticService: ElrondElasticService,
    private readonly nftRarityRepository: NftRarityRepository,
    private readonly nftRarityComputeService: NftRarityComputeService,
  ) {}

  async updateRarities(collectionTicker: string): Promise<boolean> {
    const nfts: Nft[] = await this.getAllCollectionNftsFromAPI(
      collectionTicker,
    );

    if (
      nfts?.length === 0 ||
      nfts?.find((nft) => (nft.metadata?.attributes === null) === undefined)
    ) {
      return false;
    }

    const rarities: NftRarityEntity[] =
      await this.nftRarityComputeService.computeJaccardDistancesRarities(
        this.sortAscNftsByNonce(nfts),
      );

    if (!rarities) {
      return false;
    }

    const bulkUpdates = this.buildRaritiesBulkUpdate(rarities);

    await Promise.all([
      this.nftRarityRepository.saveOrUpdateBulk(rarities),
      this.elasticService.bulkRequest('tokens', bulkUpdates),
    ]);

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
      elasticChecksum.score.toString() !== dbChecksum.score.toString() &&
      elasticChecksum.rank.toString() !== dbChecksum.rank.toString()
    )
      await this.updateRarities(collectionTicker);

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

  buildRaritiesBulkUpdate(rarities: NftRarityEntity[]): string {
    let updates: string = '';
    rarities.forEach((r) => {
      updates += this.elasticService.buildBulkUpdateBody(
        'tokens',
        r.identifier,
        'nft_score',
        r.score,
      );
      updates += this.elasticService.buildBulkUpdateBody(
        'tokens',
        r.identifier,
        'nft_rank',
        r.rank,
      );
    });
    return updates;
  }

  private async getAllCollectionNftsFromAPI(
    collectionTicker: string,
  ): Promise<Nft[]> {
    return await this.apiService.getAllNfts(
      new AssetsQuery()
        .addCollection(collectionTicker)
        .addPageSize(0, 10000)
        .build(),
    );
  }

  private async getAllCollectionNftsFromElastic(
    collectionTicker: string,
  ): Promise<Nft[]> {
    let nfts: Nft[] = [];

    const query = ElasticQuery.create()
      .withFields(['nft_score', 'nft_rank'])
      .withMustExistCondition('identifier')
      .withMustCondition(
        QueryType.Match('token', collectionTicker, QueryOperator.AND),
      )
      .withPagination({ from: 0, size: 10000 });

    await this.elasticService.getScrollableList(
      'tokens',
      'identifier',
      query,
      async (items) => {
        nfts = nfts.concat(items);
      },
    );

    return nfts;
  }

  private sortAscNftsByNonce(nfts: Nft[]): Nft[] {
    return [...nfts].sort(function (a, b) {
      return b.nonce - a.nonce;
    });
  }
}

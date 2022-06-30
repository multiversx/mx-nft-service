import { Injectable } from '@nestjs/common';
import { ElrondApiService, ElrondElasticService, Nft } from 'src/common';
import { AssetsQuery } from 'src/modules/assets';
import { NftRarityComputeService } from './nft-rarity.compute.service';
import { NftRarityEntity } from '../../db/nft-rarity/nft-rarity.entity';
import { NftRarityRepository } from '../../db/nft-rarity/nft-rarity.repository';

@Injectable()
export class NftRarityService {
  constructor(
    private readonly apiService: ElrondApiService,
    private elasticUpdater: ElrondElasticService,
    private readonly nftRarityRepository: NftRarityRepository,
    private readonly nftRarityComputeService: NftRarityComputeService,
  ) {}

  async updateRarities(collectionTicker: string): Promise<boolean> {
    const nfts: Nft[] = await this.getAllCollectionNfts(collectionTicker);

    if (!nfts || nfts.find((nft) => nft.metadata?.attributes === null))
      return false;

    const rarities: NftRarityEntity[] =
      await this.nftRarityComputeService.computeJaccardDistancesRarities(
        this.sortNftsByNonce(nfts),
      );

    if (!rarities) return false;

    const bulkUpdates = this.buildRaritiesBulkUpdate(rarities);

    await Promise.all([
      this.nftRarityRepository.saveOrUpdateBulk(rarities),
      this.elasticUpdater.bulkRequest('tokens', bulkUpdates),
    ]);

    return true;
  }

  buildRaritiesBulkUpdate(rarities: NftRarityEntity[]): string {
    let updates: string = '';
    rarities.forEach((r) => {
      updates += this.elasticUpdater.buildBulkUpdateBody(
        'tokens',
        r.identifier,
        'nft_score',
        r.score,
      );
      updates += this.elasticUpdater.buildBulkUpdateBody(
        'tokens',
        r.identifier,
        'nft_rank',
        r.rank,
      );
    });
    return updates;
  }

  private async getAllCollectionNfts(collectionTicker: string): Promise<Nft[]> {
    let nfts: Nft[] = [];
    let lastSize: number;
    do {
      lastSize = nfts.length;
      nfts = nfts.concat(
        await this.apiService.getAllNfts(
          new AssetsQuery()
            .addCollection(collectionTicker)
            .addPageSize(nfts.length, 2500)
            .build(),
        ),
      );
    } while (lastSize !== nfts.length);
    return nfts;
  }

  private sortNftsByNonce(nfts: Nft[]): Nft[] {
    return [...nfts].sort(function (a, b) {
      return b.nonce - a.nonce;
    });
  }
}

import { PerformanceProfiler } from '@elrondnetwork/erdnest';
import { Injectable } from '@nestjs/common';
import { Nft } from 'src/common';
import { ScamInfo } from 'src/modules/assets/models/ScamInfo.dto';
import { MetricsCollector } from 'src/modules/metrics/metrics.collector';
import { NftScamInfoModel } from 'src/modules/scam/models/nft-scam-info.model';
import { CollectionTraitSummary } from 'src/modules/nft-traits/models/collection-traits.model';
import { NftScamInfoRepositoryService } from './repositories/nft-scam.repository';
import { TraitRepositoryService } from './repositories/traits.repository';

@Injectable()
export class DocumentDbService {
  constructor(
    private readonly traitRepositoryService: TraitRepositoryService,
    private readonly nftScamInfoRepositoryService: NftScamInfoRepositoryService,
  ) {}

  private async execute<T>(key: string, action: Promise<T>): Promise<T> {
    const profiler = new PerformanceProfiler();
    try {
      return await action;
    } finally {
      profiler.stop();
      MetricsCollector.setPersistenceDuration(key, profiler.duration);
    }
  }

  async getTraitSummary(collection: string): Promise<CollectionTraitSummary> {
    return await this.execute(
      this.getTraitSummary.name,
      this.traitRepositoryService.getTraitSummary(collection),
    );
  }

  async deleteTraitSummary(
    collection: string,
  ): Promise<CollectionTraitSummary> {
    return await this.execute(
      this.getTraitSummary.name,
      this.traitRepositoryService.findOneAndDelete({ identifier: collection }),
    );
  }

  async saveOrUpdateTraitSummary(
    traitSummary: CollectionTraitSummary,
  ): Promise<void> {
    return await this.execute(
      this.saveOrUpdateTraitSummary.name,
      this.traitRepositoryService.saveOrUpdateTraitSummary(traitSummary),
    );
  }

  async updateTraitSummaryLastUpdated(collection: string): Promise<void> {
    return await this.execute(
      this.updateTraitSummaryLastUpdated.name,
      this.traitRepositoryService.updateTraitSummaryLastUpdated(collection),
    );
  }

  async saveOrUpdateNftScamInfo(
    identifier: string,
    version: string,
    scamInfo?: ScamInfo,
  ): Promise<void> {
    return await this.execute(
      this.saveOrUpdateBulkNftScamInfo.name,
      this.nftScamInfoRepositoryService.saveOrUpdateNftScamInfo(
        identifier,
        version,
        scamInfo,
      ),
    );
  }

  async saveOrUpdateBulkNftScamInfo(
    nfts: Nft[],
    version: string,
  ): Promise<void> {
    return await this.execute(
      this.saveOrUpdateBulkNftScamInfo.name,
      this.nftScamInfoRepositoryService.saveOrUpdateBulkNftScamInfo(
        nfts,
        version,
      ),
    );
  }

  async deleteNftScamInfo(identifier: string): Promise<void> {
    return await this.execute(
      this.deleteNftScamInfo.name,
      this.nftScamInfoRepositoryService.deleteNftScamInfo(identifier),
    );
  }

  async getBulkNftScamInfo(identifiers: string[]): Promise<NftScamInfoModel[]> {
    return await this.execute(
      this.getBulkNftScamInfo.name,
      this.nftScamInfoRepositoryService.getBulkNftScamInfo(identifiers),
    );
  }

  async getNftScamInfo(
    identifier: string,
  ): Promise<NftScamInfoModel | undefined> {
    return await this.execute(
      this.getNftScamInfo.name,
      this.nftScamInfoRepositoryService.getNftScamInfo(identifier),
    );
  }
}

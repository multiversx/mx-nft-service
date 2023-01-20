import { PerformanceProfiler } from '@elrondnetwork/erdnest';
import { Injectable } from '@nestjs/common';
import { Nft } from 'src/common';
import { ScamInfo } from 'src/modules/assets/models/ScamInfo.dto';
import { MetricsCollector } from 'src/modules/metrics/metrics.collector';
import { ScamInfoModel } from 'src/modules/scam/models/scam-info.model';
import { CollectionTraitSummary } from 'src/modules/nft-traits/models/collection-traits.model';
import { ScamInfoRepositoryService } from './repositories/scam.repository';
import { TraitRepositoryService } from './repositories/traits.repository';

@Injectable()
export class DocumentDbService {
  constructor(
    private readonly traitRepositoryService: TraitRepositoryService,
    private readonly scamInfoRepositoryService: ScamInfoRepositoryService,
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

  async saveOrUpdateScamInfo(
    identifier: string,
    version: string,
    scamInfo?: ScamInfo,
  ): Promise<void> {
    return await this.execute(
      this.saveOrUpdateScamInfo.name,
      this.scamInfoRepositoryService.saveOrUpdateScamInfo(
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
      this.scamInfoRepositoryService.saveOrUpdateBulkNftScamInfo(nfts, version),
    );
  }

  async deleteScamInfo(identifier: string): Promise<void> {
    return await this.execute(
      this.deleteScamInfo.name,
      this.scamInfoRepositoryService.deleteScamInfo(identifier),
    );
  }

  async getBulkScamInfo(identifiers: string[]): Promise<ScamInfoModel[]> {
    return await this.execute(
      this.getBulkScamInfo.name,
      this.scamInfoRepositoryService.getBulkScamInfo(identifiers),
    );
  }

  async getScamInfo(identifier: string): Promise<ScamInfoModel | undefined> {
    return await this.execute(
      this.getScamInfo.name,
      this.scamInfoRepositoryService.getNftScamInfo(identifier),
    );
  }
}

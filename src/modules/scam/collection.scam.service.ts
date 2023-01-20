import { Injectable, Logger } from '@nestjs/common';
import { ScamInfo } from '../assets/models/ScamInfo.dto';
import { ScamInfoTypeEnum } from '../assets/models';
import { DocumentDbService } from 'src/document-db/document-db.service';
import { CollectionScamElasticService } from './collection-scam.elastic.service';

@Injectable()
export class CollectionScamService {
  constructor(
    private documentDbService: DocumentDbService,
    private collectionScamElasticService: CollectionScamElasticService,
    // private mxElasticService: MxElasticService,
    // private mxApiService: MxApiService,
    private readonly logger: Logger,
  ) {}

  async manuallySetCollectionScamInfo(
    collection: string,
    type: ScamInfoTypeEnum,
    info: string,
  ): Promise<boolean> {
    await Promise.all([
      this.documentDbService.saveOrUpdateScamInfo(
        collection,
        'manual',
        new ScamInfo({
          type: ScamInfoTypeEnum[type],
          info: info,
        }),
      ),
      this.collectionScamElasticService.setNftScamInfoManuallyInElastic(
        collection,
        type,
        info,
      ),
    ]);
    // todo: collection cache invalidation
    return true;
  }

  async manuallyClearCollectionScamInfo(collection: string): Promise<boolean> {
    await Promise.all([
      this.documentDbService.saveOrUpdateScamInfo(
        collection,
        'manual',
        new ScamInfo({
          type: null,
          info: null,
        }),
      ),
      this.collectionScamElasticService.setNftScamInfoManuallyInElastic(
        collection,
        null,
        null,
      ),
    ]);
    // todo: collection cache invalidation
    return true;
  }
}

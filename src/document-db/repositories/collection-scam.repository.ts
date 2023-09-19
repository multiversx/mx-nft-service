import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EntityRepository } from './entity.repository';
import { ScamInfo } from 'src/modules/assets/models/ScamInfo.dto';
import { CollectionScamInfoDocument, CollectionScamInfoModel } from 'src/modules/scam/models/collection-scam-info.model';

@Injectable()
export class CollectionScamInfoRepositoryService extends EntityRepository<CollectionScamInfoDocument> {
  constructor(
    @InjectModel(CollectionScamInfoModel.name)
    readonly collectionScamInfoModel: Model<CollectionScamInfoDocument>,
  ) {
    super(collectionScamInfoModel);
  }

  async saveOrUpdateCollectionScamInfo(collection: string, version: string, scamInfo?: ScamInfo): Promise<void> {
    let doc: CollectionScamInfoModel = {
      collectionIdentifier: collection,
      version: version,
    };
    if (scamInfo) {
      doc = { ...doc, type: scamInfo.type, info: scamInfo.info };
    }
    const res = await this.findOneAndReplace(
      {
        collectionIdentifier: collection,
      },
      doc,
    );
    if (!res) {
      await this.create(doc);
    }
  }

  async deleteCollectionScamInfo(collection: string): Promise<void> {
    await this.findOneAndDelete({
      collectionIdentifier: collection,
    });
  }

  async getCollectionScamInfo(collection: string): Promise<CollectionScamInfoModel | undefined> {
    return await this.findOne({
      collectionIdentifier: collection,
    });
  }
}

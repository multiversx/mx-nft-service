import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EntityRepository } from './entity.repository';
import {
  NftScamInfoModel,
  NftScamInfoDocument,
} from 'src/modules/nft-scam/models/nft-scam-info.model';

@Injectable()
export class NftScamInfoRepositoryService extends EntityRepository<NftScamInfoDocument> {
  constructor(
    @InjectModel(NftScamInfoModel.name)
    private readonly nftScamInfoModel: Model<NftScamInfoDocument>,
  ) {
    super(nftScamInfoModel);
  }

  async saveOrUpdateVersionBulk(
    identifiers: string[],
    version: string,
  ): Promise<void> {
    const updates: any = identifiers.map((identifier) => {
      return {
        updateOne: {
          filter: {
            identifier: identifier,
          },
          update: {
            identifier: identifier,
            version: version,
          },
          upsert: true,
        },
      };
    });
    await this.entityModel.bulkWrite(updates);
  }

  async getManyByIdentifiers(
    identifiers: string[],
  ): Promise<NftScamInfoModel[]> {
    return await this.entityModel.find({ identifier: { $in: identifiers } });
  }

  async getBulkOutdated(
    currentVersion: string,
    limit: number,
  ): Promise<NftScamInfoModel[]> {
    return await this.entityModel
      .find({
        version: { $ne: currentVersion },
      })
      .limit(limit);
  }
}

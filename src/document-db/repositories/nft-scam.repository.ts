import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EntityRepository } from './entity.repository';
import {
  NftScamInfoModel,
  NftScamInfoDocument,
} from 'src/modules/nft-scam/models/nft-scam-info.model';
import { Nft } from 'src/common';

@Injectable()
export class NftScamInfoRepositoryService extends EntityRepository<NftScamInfoDocument> {
  constructor(
    @InjectModel(NftScamInfoModel.name)
    private readonly nftScamInfoModel: Model<NftScamInfoDocument>,
  ) {
    super(nftScamInfoModel);
  }

  async saveOrUpdateBulk(nfts: Nft[], scamInfoVersion: string): Promise<void> {
    const updates: any = nfts.map((nft) => {
      let update: any = {
        identifier: nft.identifier,
        version: scamInfoVersion,
      };
      if (nft.scamInfo) {
        update = {
          ...update,
          type: nft.scamInfo.type,
          info: nft.scamInfo.info,
        };
      }
      return {
        updateOne: {
          filter: {
            identifier: nft.identifier,
          },
          update,
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

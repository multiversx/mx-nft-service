import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EntityRepository } from './entity.repository';
import {
  ScamInfoModel,
  ScamInfoDocument as ScamInfoDocument,
} from 'src/modules/scam/models/scam-info.model';
import { Nft } from 'src/common';
import { ScamInfo } from 'src/modules/assets/models/ScamInfo.dto';

@Injectable()
export class ScamInfoRepositoryService extends EntityRepository<ScamInfoDocument> {
  constructor(
    @InjectModel(ScamInfoModel.name)
    private readonly scamInfoModel: Model<ScamInfoDocument>,
  ) {
    super(scamInfoModel);
  }

  async saveOrUpdateScamInfo(
    identifier: string,
    version: string,
    scamInfo?: ScamInfo,
  ): Promise<void> {
    let doc: ScamInfoModel = {
      identifier: identifier,
      version: version,
    };
    if (scamInfo) {
      doc = { ...doc, type: scamInfo.type, info: scamInfo.info };
    }
    const res = await this.findOneAndReplace(
      {
        identifier: identifier,
      },
      doc,
    );
    if (!res) {
      await this.create(doc);
    }
  }

  async saveOrUpdateBulkNftScamInfo(
    nfts: Nft[],
    version: string,
  ): Promise<void> {
    if (!nfts || nfts.length === 0) {
      return;
    }
    await this.saveOrUpdateBulkNftScams(nfts, version);
  }

  async deleteScamInfo(identifier: string): Promise<void> {
    await this.findOneAndDelete({
      identifier: identifier,
    });
  }

  async getBulkScamInfo(identifiers: string[]): Promise<ScamInfoModel[]> {
    return await this.getManyByIdentifiers(identifiers);
  }

  async getNftScamInfo(identifier: string): Promise<ScamInfoModel | undefined> {
    return await this.findOne({
      identifier: identifier,
    });
  }

  private async saveOrUpdateBulkNftScams(
    nfts: Nft[],
    scamEngineVersion: string,
  ): Promise<void> {
    const updates: any = nfts.map((nft) => {
      let update: any = {
        identifier: nft.identifier,
        version: scamEngineVersion,
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

  private async getManyByIdentifiers(
    identifiers: string[],
  ): Promise<ScamInfoModel[]> {
    return await this.entityModel.find({ identifier: { $in: identifiers } });
  }
}

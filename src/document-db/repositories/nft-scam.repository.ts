import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EntityRepository } from './entity.repository';
import { NftScamInfoModel, NftScamInfoDocument } from 'src/modules/scam/models/nft-scam-info.model';
import { ScamInfo } from 'src/modules/assets/models/ScamInfo.dto';
import { Asset } from 'src/modules/assets/models';

@Injectable()
export class NftScamInfoRepositoryService extends EntityRepository<NftScamInfoDocument> {
  constructor(
    @InjectModel(NftScamInfoModel.name)
    private readonly nftScamInfoModel: Model<NftScamInfoDocument>,
  ) {
    super(nftScamInfoModel);
  }

  async saveOrUpdateNftScamInfo(identifier: string, version: string, scamInfo?: ScamInfo): Promise<void> {
    let doc: NftScamInfoModel = {
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

  async saveOrUpdateBulkNftScamInfo(nfts: Asset[], version: string): Promise<void> {
    if (!nfts || nfts.length === 0) {
      return;
    }
    await this.saveOrUpdateBulk(nfts, version);
  }

  async deleteNftScamInfo(identifier: string): Promise<void> {
    await this.findOneAndDelete({
      identifier: identifier,
    });
  }

  async getBulkNftScamInfo(identifiers: string[]): Promise<NftScamInfoModel[]> {
    return await this.getManyByIdentifiers(identifiers);
  }

  async getNftScamInfo(identifier: string): Promise<NftScamInfoModel | undefined> {
    return await this.findOne({
      identifier: identifier,
    });
  }

  private async saveOrUpdateBulk(nfts: Asset[], scamEngineVersion: string): Promise<void> {
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

  private async getManyByIdentifiers(identifiers: string[]): Promise<NftScamInfoModel[]> {
    return await this.entityModel.find({ identifier: { $in: identifiers } });
  }
}

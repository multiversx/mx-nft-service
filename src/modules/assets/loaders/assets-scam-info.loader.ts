import DataLoader = require('dataloader');
import { BaseProvider } from '../../common/base.loader';
import { AssetScamInfoRedisHandler } from './assets-scam-info.redis-handler';
import { Injectable, Scope } from '@nestjs/common';
import { Asset, ScamInfoTypeEnum } from '../models';
import { DocumentDbService } from 'src/document-db/document-db.service';
import { ScamInfo } from '../models/ScamInfo.dto';

@Injectable({
  scope: Scope.REQUEST,
})
export class AssetScamInfoProvider extends BaseProvider<string> {
  constructor(private assetScamInfoRedisHandler: AssetScamInfoRedisHandler, private documentDbService: DocumentDbService) {
    super(assetScamInfoRedisHandler, new DataLoader(async (keys: string[]) => await this.batchLoad(keys)));
  }

  async getData(identifiers: string[]) {
    const bulkNftScamInfo = await this.documentDbService.getBulkNftScamInfo(identifiers);
    const nfts: Asset[] = bulkNftScamInfo.map(
      (nft) =>
        new Asset({
          identifier: nft.identifier,
          scamInfo: nft.type
            ? new ScamInfo({
                type: ScamInfoTypeEnum[nft.type],
                info: nft.info,
              })
            : null,
        }),
    );
    return nfts?.groupBy((asset) => asset.identifier);
  }

  public batchScamInfo = async (identifiers: string[], data: any) => {
    return this.assetScamInfoRedisHandler.batchScamInfo(identifiers, data);
  };
}

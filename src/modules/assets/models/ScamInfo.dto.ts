import { ObjectType, Field } from '@nestjs/graphql';
import { ScamInfoApi } from 'src/common/services/mx-communication/models/scam-info.dto';
import { elasticDictionary } from 'src/config';
import { NftScamInfoModel } from 'src/modules/scam/models/nft-scam-info.model';
import { Asset, ScamInfoTypeEnum } from '.';
@ObjectType()
export class ScamInfo {
  @Field(() => ScamInfoTypeEnum, { nullable: true })
  type: ScamInfoTypeEnum;
  @Field(() => String, { nullable: true })
  info: string;

  constructor(init?: Partial<ScamInfo>) {
    Object.assign(this, init);
  }

  static fromScamInfoApi(scamInfo: ScamInfoApi): ScamInfo | undefined {
    return scamInfo?.type
      ? new ScamInfo({
          type: ScamInfoTypeEnum[scamInfo.type],
          info: scamInfo.info,
        })
      : undefined;
  }

  static areApiAndElasticScamInfoDifferent(nftFromApi: Asset, nftFromElastic: any): boolean {
    return (
      nftFromApi.scamInfo.type !== nftFromElastic?.[elasticDictionary.scamInfo.typeKey] ||
      nftFromApi.scamInfo.info !== nftFromElastic?.[elasticDictionary.scamInfo.infoKey]
    );
  }

  static areApiAndDbScamInfoDifferent(nftFromApi: Asset, nftFromDb: NftScamInfoModel, version: string): boolean {
    return (
      !nftFromDb ||
      version !== nftFromDb.version ||
      ScamInfoTypeEnum[nftFromApi.scamInfo.type] !== nftFromDb.type ||
      nftFromApi.scamInfo.info !== nftFromDb.info
    );
  }

  static areElasticAndDbScamInfoDifferent(nftFromElastic: any, nftFromDb: NftScamInfoModel): boolean {
    return (
      nftFromDb?.type !== nftFromElastic?.[elasticDictionary.scamInfo.typeKey] ||
      (!nftFromDb.type && nftFromElastic?.[elasticDictionary.scamInfo.typeKey])
    );
  }

  static isScam(scamInfo: ScamInfo): boolean {
    return scamInfo.type !== ScamInfoTypeEnum.none;
  }

  static none(): ScamInfo {
    return new ScamInfo({
      type: ScamInfoTypeEnum.none,
      info: null,
    });
  }

  static scam(): ScamInfo {
    return new ScamInfo({
      type: ScamInfoTypeEnum.scam,
      info: 'Scam report',
    });
  }
}

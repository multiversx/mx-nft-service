import { ObjectType, Field } from '@nestjs/graphql';
import { Nft, NftScamInfo } from 'src/common';
import { elasticDictionary } from 'src/config';
import { ScamInfoModel } from 'src/modules/scam/models/scam-info.model';
import { ScamInfoTypeEnum } from '.';
@ObjectType()
export class ScamInfo {
  @Field(() => ScamInfoTypeEnum, { nullable: true })
  type: ScamInfoTypeEnum;
  @Field(() => String, { nullable: true })
  info: string;

  constructor(init?: Partial<ScamInfo>) {
    Object.assign(this, init);
  }

  static fromNftScamInfo(scamInfo: NftScamInfo) {
    return scamInfo
      ? new ScamInfo({
          type: ScamInfoTypeEnum[scamInfo.type],
          info: scamInfo.info,
        })
      : new ScamInfo();
  }

  static areApiAndElasticScamInfoDifferent(
    nftFromApi: Nft,
    nftFromElastic: any,
  ): boolean {
    return (
      nftFromApi.scamInfo.type !==
        nftFromElastic?.[elasticDictionary.scamInfo.typeKey] ||
      nftFromApi.scamInfo.info !==
        nftFromElastic?.[elasticDictionary.scamInfo.infoKey]
    );
  }

  static areApiAndDbScamInfoDifferent(
    nftFromApi: Nft,
    nftFromDb: ScamInfoModel,
    version: string,
  ): boolean {
    return (
      !nftFromDb ||
      version !== nftFromDb.version ||
      nftFromApi.scamInfo.type !== nftFromDb.type ||
      nftFromApi.scamInfo.info !== nftFromDb.info
    );
  }

  static areElasticAndDbScamInfoDifferent(
    nftFromElastic: any,
    nftFromDb: ScamInfoModel,
  ): boolean {
    return (
      nftFromDb?.type !==
        nftFromElastic?.[elasticDictionary.scamInfo.typeKey] ||
      (!nftFromDb.type && nftFromElastic?.[elasticDictionary.scamInfo.typeKey])
    );
  }
}

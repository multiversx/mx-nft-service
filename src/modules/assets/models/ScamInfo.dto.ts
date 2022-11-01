import { ObjectType, Field } from '@nestjs/graphql';
import { Nft, NftScamInfo } from 'src/common';
import { NftScamEntity } from 'src/db/reports-nft-scam';
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
    version: string,
  ): boolean {
    return (
      version !== nftFromElastic.nft_scamInfoVersion ||
      nftFromApi.scamInfo.type !== nftFromElastic.nft_scamInfoType ||
      nftFromApi.scamInfo.info !== nftFromElastic.nft_scamInfoDescription
    );
  }

  static areApiAndDbScamInfoDifferent(
    nftFromApi: Nft,
    nftFromDb: NftScamEntity,
    version: string,
  ): boolean {
    return (
      !nftFromDb ||
      version !== nftFromDb.version ||
      nftFromApi.scamInfo.type !== nftFromDb.type ||
      nftFromApi.scamInfo.info !== nftFromDb.info
    );
  }
}

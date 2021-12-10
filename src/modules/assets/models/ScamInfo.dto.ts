import { ObjectType, Field, Int } from '@nestjs/graphql';
import { NftScamInfo } from 'src/common';
import { ScamInfoTypeEnum } from '.';
@ObjectType()
export class ScamInfo {
  @Field(() => String)
  type: string;
  @Field(() => String)
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
      : null;
  }
}

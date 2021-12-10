import { ObjectType, Field } from '@nestjs/graphql';
import { NftScamInfo } from 'src/common';
import { ScamInfoTypeEnum } from '.';
@ObjectType()
export class ScamInfo {
  @Field(() => String, { nullable: true })
  type: string;
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
      : null;
  }
}

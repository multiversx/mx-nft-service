import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { CollectionApi } from 'src/common';
import { ScamInfoTypeEnum } from 'src/modules/assets/models';

export type ScamInfoDocument = ScamInfoModel & Document;

@Schema({ collection: 'scam_info' })
export class ScamInfoModel {
  @Prop()
  identifier: string;
  @Prop({ type: String })
  version: string;
  @Prop({ type: ScamInfoTypeEnum, nullable: true })
  type?: ScamInfoTypeEnum;
  @Prop({ type: String, nullable: true })
  info?: string;

  constructor(init?: Partial<ScamInfoModel>) {
    Object.assign(this, init);
  }

  public static fromCollectionApi(
    collectionApi: CollectionApi,
  ): ScamInfoModel | undefined {
    return collectionApi.scamInfo
      ? new ScamInfoModel({
          identifier: collectionApi.ticker,
          version: collectionApi.scamInfo?.version,
          type: collectionApi.scamInfo?.type,
          info: collectionApi.scamInfo?.info,
        })
      : undefined;
  }
}

export const ScamInfoSchema = SchemaFactory.createForClass(ScamInfoModel).index(
  {
    identifier: 1,
  },
  { unique: true },
);

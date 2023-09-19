import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NftScamInfoDocument = NftScamInfoModel & Document;

@Schema({ collection: 'scam_info' })
export class NftScamInfoModel {
  @Prop()
  identifier: string;
  @Prop({ type: String })
  version: string;
  @Prop({ type: String, nullable: true })
  type?: string;
  @Prop({ type: String, nullable: true })
  info?: string;

  constructor(init?: Partial<NftScamInfoModel>) {
    Object.assign(this, init);
  }
}

export const NftScamInfoSchema = SchemaFactory.createForClass(NftScamInfoModel).index(
  {
    identifier: 1,
  },
  { unique: true },
);

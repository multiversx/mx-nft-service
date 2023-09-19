import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CollectionScamInfoDocument = CollectionScamInfoModel & Document;

@Schema({ collection: 'collection_scam_info' })
export class CollectionScamInfoModel {
  @Prop()
  collectionIdentifier: string;
  @Prop({ type: String })
  version: string;
  @Prop({ type: String, nullable: true })
  type?: string;
  @Prop({ type: String, nullable: true })
  info?: string;

  constructor(init?: Partial<CollectionScamInfoModel>) {
    Object.assign(this, init);
  }
}

export const CollectionScamInfoSchema = SchemaFactory.createForClass(CollectionScamInfoModel).index(
  {
    collectionIdentifier: 1,
  },
  { unique: true },
);

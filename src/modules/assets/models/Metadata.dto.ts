import { ObjectType, Field } from '@nestjs/graphql';
import { NftMetadata } from 'src/common';
import { Rarity } from './Rarity';

@ObjectType()
export class Metadata {
  @Field(() => String, { nullable: true })
  description: string;

  @Field(() => [AttributeType], { nullable: true })
  attributes: AttributeType[];

  @Field(() => String, {
    nullable: true,
    deprecationReason: 'This field will be removed in the next version',
  })
  fileType: string;
  @Field(() => String, {
    nullable: true,
    deprecationReason: 'This field will be removed in the next version',
  })
  fileUri: string;
  @Field(() => String, {
    nullable: true,
    deprecationReason: 'This field will be removed in the next version',
  })
  fileName: string;

  constructor(init?: Partial<Metadata>) {
    Object.assign(this, init);
  }

  static fromNftMetadata(metadata: NftMetadata) {
    return metadata
      ? new Metadata({
          description: metadata?.description,
          attributes: metadata?.attributes
            ? AttributeType.fromMetadataAttributes(metadata.attributes)
            : null,
        })
      : null;
  }
}

@ObjectType()
export class AttributeType {
  @Field(() => [KeyValueType])
  attribute: KeyValueType[];
  constructor(init?: Partial<AttributeType>) {
    Object.assign(this, init);
  }

  static fromMetadataAttributes(attributes: [{ [key: string]: string }]) {
    const res: AttributeType[] = [];
    if (Array.isArray(attributes)) {
      for (const pair of attributes) {
        if (pair === Object(pair)) {
          let data: KeyValueType[] = [];
          if (pair['trait_type'] && pair['value']) {
            data.push(
              new KeyValueType({
                key: 'trait_type',
                value: pair['trait_type'],
              }),
              new KeyValueType({
                key: 'value',
                value: pair['value'],
              }),
            );
            res.push(new AttributeType({ attribute: data }));
          }
        }
      }
    }
    return res;
  }
}

@ObjectType()
export class KeyValueType {
  @Field()
  key: String;
  @Field()
  value: String;
  constructor(init?: Partial<KeyValueType>) {
    Object.assign(this, init);
  }
}

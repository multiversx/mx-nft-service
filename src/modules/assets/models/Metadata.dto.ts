import { ObjectType, Field } from '@nestjs/graphql';
import { NftMetadata } from 'src/common';

@ObjectType()
export class Metadata {
  @Field(() => String, { nullable: true })
  description: string;

  @Field(() => [AttributeType], { nullable: true })
  attributes: AttributeType[];

  @Field(() => String, { nullable: true })
  interactiveUrl: string;

  constructor(init?: Partial<Metadata>) {
    Object.assign(this, init);
  }

  static fromNftMetadata(metadata: NftMetadata) {
    if (!metadata) {
      return null;
    }
    const metadataBody =
      typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
    return new Metadata({
      description: metadataBody?.description,
      attributes: metadataBody?.attributes
        ? AttributeType.fromMetadataAttributes(metadataBody.attributes)
        : null,
      interactiveUrl: metadataBody.interactive_url,
    });
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
      for (const attribute of attributes) {
        if (attribute === Object(attribute)) {
          let data: KeyValueType[] = [];
          if (
            (attribute['trait_type'] !== undefined ||
              attribute['name'] !== undefined) &&
            attribute['value'] !== undefined
          ) {
            data.push(
              new KeyValueType({
                key: 'trait_type',
                value: attribute['trait_type'] ?? attribute['name'],
              }),
              new KeyValueType({
                key: 'value',
                value: attribute['value'],
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

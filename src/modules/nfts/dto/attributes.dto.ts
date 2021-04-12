import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Attribute {
  @Field()
  attributeId: string;
  @Field()
  key: string;
  @Field()
  value: string;
  @Field()
  description?: string;
}

import { Attribute } from './attributes.dto';
import { ID, ObjectType, GraphQLISODateTime, Field } from '@nestjs/graphql';
import { Price } from './price.dto';
import { Onwer } from './onwer.dto';
import { Account } from './account.dto';

@ObjectType()
export class Asset {
  @Field(() => ID)
  tokenId!: string;
  @Field()
  tokenNonce!: string;
  @Field(() => Price)
  lastSalePrice: Price;
  @Field({ nullable: false })
  hash: string;
  @Field(() => Account)
  creator: Account;
  @Field(() => Onwer)
  currentOwner: Onwer;
  @Field(() => [Onwer])
  previousOwners: Onwer[];
  @Field()
  name!: string;
  @Field({ nullable: false })
  royalties: string; //creator percentage
  @Field(() => [Attribute])
  attributes: Attribute[];
  @Field(() => GraphQLISODateTime)
  lastSale: Date;
  @Field(() => GraphQLISODateTime)
  creationDate!: Date;
  @Field(() => [String])
  uris: string[];
  @Field(() => [String])
  tags: string[];
}

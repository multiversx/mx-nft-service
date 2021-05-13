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
  tokenNonce!: number;
  @Field(() => Price, { nullable: true })
  lastSalePrice: Price = null;
  @Field({ nullable: false })
  hash: string;
  @Field(() => String)
  creatorAddress: string;
  @Field(() => Account)
  creator: Account = null;
  @Field(() => String)
  ownerAddress: string;
  @Field(() => Onwer)
  currentOwner: Onwer = null;
  @Field(() => [Onwer])
  previousOwners: Onwer[] = [];
  @Field()
  name!: string;
  @Field()
  royalties: string; //creator percentage
  @Field(() => String)
  attributes: string;
  @Field(() => GraphQLISODateTime)
  lastSale: Date;
  @Field(() => GraphQLISODateTime)
  creationDate!: Date;
  @Field(() => [String], { nullable: false })
  uris: string[];
  @Field(() => [String])
  tags: string[] = [];

  constructor(init?: Partial<Asset>) {
    Object.assign(this, init);
  }
}

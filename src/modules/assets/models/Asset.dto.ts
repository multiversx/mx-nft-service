import { ID, ObjectType, GraphQLISODateTime, Field, Int } from '@nestjs/graphql';
import { Price } from './Price.dto';
import { Onwer } from './Onwer.dto';
import { Account } from '../../accounts/models/account.dto';
import { Auction } from 'src/modules/auctions/models';

@ObjectType()
export class Asset {
  @Field(() => ID)
  tokenIdentifier!: string;
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
  @Field(() => Auction, { nullable: true })
  auction: Auction;
  @Field(() => [String])
  tags: string[] = [];
  @Field(() => Int)
  likesCount: number;
  @Field(() => Boolean)
  isLiked: boolean;

  constructor(init?: Partial<Asset>) {
    Object.assign(this, init);
  }
}

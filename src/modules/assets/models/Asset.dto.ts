import {
  ID,
  ObjectType,
  GraphQLISODateTime,
  Field,
  Int,
} from '@nestjs/graphql';
import { Price } from './Price.dto';
import { Owner } from './Owner.dto';
import { Account } from '../../accounts/models';
import { Auction } from '../../auctions/models';
import { TokenTypeEnum } from './TokenTypes.enum';
import { Token } from 'src/common/services/elrond-communication/models/token.dto';

@ObjectType()
export class Asset {
  @Field(() => ID)
  token!: string;
  @Field(() => Int)
  nonce!: number;
  @Field(() => TokenTypeEnum)
  type: TokenTypeEnum;
  @Field(() => String)
  identifier!: string;
  @Field(() => Price, { nullable: true })
  lastSalePrice: Price = null;
  @Field({ nullable: true })
  hash: string;
  @Field(() => String)
  creatorAddress: string;
  @Field(() => Account)
  creator: Account = null;
  @Field(() => String)
  ownerAddress: string;
  @Field(() => Owner, { nullable: true })
  currentOwner: Owner;
  @Field(() => [Owner], { nullable: true })
  previousOwners: Owner[];
  @Field()
  name!: string;
  @Field()
  royalties: string; //creator percentage
  @Field(() => String)
  attributes: string;
  @Field(() => GraphQLISODateTime)
  lastSale: Date;
  @Field(() => String)
  creationDate!: string;
  @Field(() => [String], { nullable: false })
  uris: string[];
  @Field(() => Auction, { nullable: true })
  auction: Auction;
  @Field(() => [String], { nullable: true })
  tags: string[];
  @Field(() => Int)
  likesCount: number;
  @Field(() => Boolean)
  isLiked: boolean;

  constructor(init?: Partial<Asset>) {
    Object.assign(this, init);
  }

  static fromToken(token: Token) {
    return token
      ? new Asset({
          token: token.collection,
          type: TokenTypeEnum[token.type],
          nonce: token.nonce ?? 0,
          identifier: token.identifier,
          creatorAddress: token.creator ?? '',
          ownerAddress: token.owner,
          attributes: token.attributes ?? '',
          lastSale: new Date(),
          creationDate: token.timestamp,
          hash: token.hash ?? '',
          name: token.name,
          royalties: token.royalties ?? '',
          uris: token.uris || [''],
          tags: token.tags || [''],
        })
      : null;
  }
}

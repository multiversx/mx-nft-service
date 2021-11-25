import { ID, ObjectType, Field, Int } from '@nestjs/graphql';
import { Auction } from '../../auctions/models';
import { NftTypeEnum } from './NftTypes.enum';
import { Metadata } from './Metadata.dto';
import { Nft } from 'src/common';
import { Account } from 'src/modules/accounts/models';

@ObjectType()
export class Asset {
  @Field(() => ID)
  collection!: string;
  @Field(() => Int)
  nonce!: number;
  @Field(() => NftTypeEnum, { nullable: true })
  type: NftTypeEnum;
  @Field(() => String)
  identifier!: string;
  @Field({ nullable: true })
  hash: string;
  @Field(() => String)
  creatorAddress: string;
  @Field(() => Account, { nullable: true })
  creator: Account;
  @Field(() => String, { nullable: true })
  ownerAddress: string;
  @Field(() => Account, { nullable: true })
  owner: Account;
  @Field({ nullable: true })
  name: string;
  @Field()
  royalties: string;
  @Field(() => String)
  attributes: string;
  @Field(() => Boolean)
  isWhitelistedStorage: boolean;
  @Field(() => String, { nullable: true })
  balance: string;
  @Field(() => String)
  supply: string;
  @Field(() => String, { nullable: true })
  totalRunningAuctions: string;
  @Field(() => String, { nullable: true })
  totalAvailableTokens: string;
  @Field(() => Boolean, { nullable: true })
  hasAvailableAuctions: boolean;
  @Field(() => Int, { nullable: true })
  creationDate!: number;
  @Field(() => [String])
  uris: string[];
  @Field(() => String, { nullable: true })
  url: string;
  @Field(() => String, { nullable: true })
  thumbnailUrl: string;
  @Field(() => [Auction], { nullable: true })
  auctions: Auction[];
  @Field(() => Auction, { nullable: true })
  lowestAuction: Auction;
  @Field(() => [String], { nullable: true })
  tags: string[];
  @Field(() => Int, { nullable: true })
  likesCount: number;
  @Field(() => Boolean, { nullable: true })
  isLiked: boolean;
  @Field(() => Metadata, { nullable: true })
  metadata: Metadata;

  constructor(init?: Partial<Asset>) {
    Object.assign(this, init);
  }

  static fromNft(nft: Nft) {
    return nft
      ? new Asset({
          collection: nft.collection,
          type: NftTypeEnum[nft.type],
          nonce: nft.nonce ?? 0,
          identifier: nft.identifier,
          creatorAddress: nft.creator ?? '',
          ownerAddress: nft.owner,
          attributes: nft.attributes ?? '',
          creationDate: nft.timestamp,
          hash: nft.hash ?? '',
          balance: nft.balance,
          supply: nft.supply || '1',
          name: nft.name,
          royalties: nft.royalties ?? '',
          uris: nft.uris || [''],
          url: nft.url || '',
          thumbnailUrl: nft.thumbnailUrl || '',
          metadata: Metadata.fromNftMetadata(nft.metadata),
          tags: nft.tags,
          isWhitelistedStorage: nft.isWhitelistedStorage,
        })
      : null;
  }
}

import {
  ID,
  ObjectType,
  GraphQLISODateTime,
  Field,
  Int,
} from '@nestjs/graphql';
import { Price } from './Price.dto';
import { Auction } from '../../auctions/models';
import { NftTypeEnum } from './NftTypes.enum';
import { Metadata } from './Metadata.dto';
import { Nft } from 'src/common/services/elrond-communication/models/nft.dto';
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
  @Field(() => Price, { nullable: true })
  lastSalePrice: Price = null;
  @Field({ nullable: true })
  hash: string;
  @Field(() => String)
  creatorAddress: string;
  @Field({ nullable: true })
  creator: Account;
  @Field(() => [String], { nullable: 'itemsAndList' })
  ownersAddresses: string[];
  @Field(() => [Account], { nullable: true })
  owners: Account[];
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
  @Field(() => String, { nullable: true })
  balance: string;
  @Field(() => String)
  supply: string;
  @Field(() => GraphQLISODateTime)
  lastSale: Date;
  @Field(() => String, { nullable: true })
  creationDate!: string;
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
          ownersAddresses: nft.owners?.map((account) => account.address),
          ownerAddress: nft.owner,
          attributes: nft.attributes ?? '',
          lastSale: new Date(),
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
        })
      : null;
  }
}

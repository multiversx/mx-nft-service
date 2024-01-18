import { ObjectType, Field, Int } from '@nestjs/graphql';
import { CollectionApi, RolesApi } from 'src/common';
import { Account } from 'src/modules/account-stats/models';
import { AssetsResponse } from 'src/modules/assets/models';
import { NftTypeEnum } from 'src/modules/assets/models/NftTypes.enum';
import { ScamInfo } from 'src/modules/assets/models/ScamInfo.dto';
import { CollectionNftTrait } from 'src/modules/nft-traits/models/collection-traits.model';
import { CollectionAsset } from './CollectionAsset.dto';
import { CollectionSocial } from './CollectionSocial.dto';
import { CollectionVolumeLast24 } from 'src/modules/analytics/models/collection-volume';
import { CollectionElastic } from 'src/common/services/mx-communication/elastic-collection.model';

@ObjectType()
export class Collection {
  @Field({ nullable: true })
  collection?: string;
  @Field({ nullable: true })
  type: NftTypeEnum;
  @Field()
  ticker!: string;
  @Field({ nullable: true })
  ownerAddress: string;
  @Field({ nullable: true })
  owner: Account;
  @Field({ nullable: true })
  artist: Account;
  @Field(() => CollectionAsset, { nullable: true })
  collectionAsset: CollectionAsset;
  @Field(() => AssetsResponse, {
    nullable: true,
    description: 'This will return only the first 10 assets',
  })
  assets: AssetsResponse;
  @Field()
  name: string;
  @Field(() => Int)
  creationDate: number;
  @Field({ nullable: true })
  canTransferRole: boolean;
  @Field({ nullable: true })
  canPause: boolean;
  @Field({ nullable: true })
  canFreeze: boolean;
  @Field({ nullable: true })
  canWipe: boolean;
  @Field({ nullable: true })
  canCreate: boolean;
  @Field({ nullable: true })
  canBurn: boolean;
  @Field({ nullable: true })
  canAddQuantity: boolean;
  @Field(() => [CollectionRole], { nullable: true })
  roles: CollectionRole[];
  @Field()
  verified: boolean;
  @Field({ nullable: true })
  website: string;
  @Field({ nullable: true })
  description: string;
  @Field({ nullable: true })
  status: string;
  @Field({ nullable: true })
  pngUrl: string;
  @Field({ nullable: true })
  svgUrl: string;
  @Field(() => CollectionSocial, { nullable: true })
  social: CollectionSocial;
  @Field(() => Int)
  onSaleAssetsCount: number;
  @Field(() => Int, { nullable: true })
  nftsCount: number;
  @Field(() => String)
  artistAddress: string;
  @Field(() => Int)
  artistFollowersCount: number;
  @Field(() => [CollectionNftTrait], { nullable: 'itemsAndList' })
  traits: CollectionNftTrait[];
  @Field({ nullable: true })
  preferredRankAlgorithm: string;
  @Field(() => String)
  aggregatorUrl: string;
  @Field(() => ScamInfo, { nullable: true })
  scamInfo: ScamInfo;
  last24Trading: CollectionVolumeLast24;
  last24USDVolume: number;

  constructor(init?: Partial<Collection>) {
    Object.assign(this, init);
  }

  static fromCollectionApi(collectionApi: CollectionApi, artistAddress?: string, followersCount?: number) {
    if (!collectionApi) return null;
    return new Collection({
      collection: collectionApi.collection,
      artistAddress: artistAddress,
      type: NftTypeEnum[collectionApi.type],
      ticker: collectionApi.ticker,
      ownerAddress: collectionApi.owner,
      creationDate: collectionApi.timestamp,
      name: collectionApi.name,
      canTransferRole: collectionApi.canTransferRole,
      canPause: collectionApi.canPause,
      canBurn: collectionApi.canBurn,
      canFreeze: collectionApi.canFreeze,
      canWipe: collectionApi.canWipe,
      canAddQuantity: collectionApi.canAddQuantity,
      canCreate: collectionApi.canCreate,
      roles: collectionApi.roles?.map((role) => CollectionRole.fromRoleApi(role)),
      verified: !!collectionApi.assets ?? false,
      description: collectionApi.assets?.description,
      website: collectionApi.assets?.website,
      pngUrl: collectionApi.assets?.pngUrl,
      svgUrl: collectionApi.assets?.svgUrl,
      social: CollectionSocial.fromSocialApi(collectionApi.assets?.social),
      collectionAsset: new CollectionAsset({
        collectionIdentifer: collectionApi.collection,
      }),
      artistFollowersCount: followersCount,
      nftsCount: collectionApi.count,
      traits: CollectionNftTrait.fromCollectionTraits(collectionApi.traits),
      preferredRankAlgorithm: collectionApi.assets?.preferredRankAlgorithm,
      scamInfo: ScamInfo.fromScamInfoApi(collectionApi.scamInfo),
    });
  }

  static fromCollectionElastic(collectionElastic: CollectionElastic, artistAddress?: string, followersCount?: number) {
    if (!collectionElastic) {
      return null;
    }

    return new Collection({
      collection: collectionElastic.token,
      artistAddress: artistAddress,
      type: NftTypeEnum[collectionElastic.type],
      ticker: collectionElastic.ticker,
      ownerAddress: collectionElastic.currentOwner,
      creationDate: collectionElastic.timestamp,
      name: collectionElastic.name,
      canTransferRole: collectionElastic.properties.canTransferNFTCreateRole,
      canPause: collectionElastic.properties.canPause,
      canBurn: collectionElastic.properties.canBurn,
      canFreeze: collectionElastic.properties.canFreeze,
      canWipe: collectionElastic.properties.canWipe,
      canAddQuantity: collectionElastic.properties.canAddQuantity,
      canCreate: collectionElastic.properties.canMint,
      artistFollowersCount: followersCount,
      nftsCount: collectionElastic.api_nftCount,
      verified: collectionElastic.api_isVerified ?? false,
    });
  }
}

@ObjectType()
export class CollectionRole {
  @Field({ nullable: true })
  address?: string;
  @Field({ nullable: true })
  canCreate: boolean;
  @Field({ nullable: true })
  canBurn: boolean;
  @Field({ nullable: true })
  canAddQuantity: boolean;
  @Field({ nullable: true })
  canUpdateAttributes: boolean;
  @Field({ nullable: true })
  canAddUri: boolean;
  @Field({ nullable: true })
  canTransferRole: boolean;
  @Field(() => [String])
  roles: string[];

  constructor(init?: Partial<CollectionRole>) {
    Object.assign(this, init);
  }

  static fromRoleApi(role: RolesApi) {
    return !role
      ? null
      : new CollectionRole({
          address: role.address,
          canCreate: role.canCreate,
          canBurn: role.canBurn,
          canAddQuantity: role.canAddQuantity,
          canAddUri: role.canAddUri,
          canTransferRole: role.canTransferRole,
          canUpdateAttributes: role.canUpdateAttributes,
          roles: role.roles,
        });
  }
}

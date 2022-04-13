import { ObjectType, Field } from '@nestjs/graphql';
import { CollectionApi, RolesApi } from 'src/common';
import { Account } from 'src/modules/account-stats/models';
import { NftTypeEnum } from 'src/modules/assets/models/NftTypes.enum';
import { CollectionAsset } from './CollectionAsset.dto';
import { CollectionSocial } from './CollectionSocial.dto';

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
  @Field(() => CollectionAsset, { nullable: true })
  collectionAsset: CollectionAsset;
  @Field()
  name: string;
  @Field()
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
  @Field({ nullable: true })
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

  constructor(init?: Partial<Collection>) {
    Object.assign(this, init);
  }

  static fromCollectionApi(collectionApi: CollectionApi) {
    return !collectionApi
      ? null
      : new Collection({
          collection: collectionApi.collection,
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
          roles: collectionApi.roles?.map((role) =>
            CollectionRole.fromRoleApi(role),
          ),
          verified: !!collectionApi.assets ?? false,
          description: collectionApi.assets?.description,
          website: collectionApi.assets?.website,
          pngUrl: collectionApi.assets?.pngUrl,
          svgUrl: collectionApi.assets?.svgUrl,
          social: CollectionSocial.fromSocialApi(collectionApi.assets?.social),
          collectionAsset: new CollectionAsset({
            collectionIdentifer: collectionApi.collection,
          }),
        });
  }
}

@ObjectType()
export class CollectionRole {
  @Field()
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

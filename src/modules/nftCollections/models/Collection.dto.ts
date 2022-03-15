import { ObjectType, Field } from '@nestjs/graphql';
import { CollectionApi, RolesApi } from 'src/common';
import { Account } from 'src/modules/account-stats/models';
import { NftTypeEnum } from 'src/modules/assets/models/NftTypes.enum';
import { CollectionAsset } from './CollectionAsset.dto';

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
          roles: role.roles,
        });
  }
}

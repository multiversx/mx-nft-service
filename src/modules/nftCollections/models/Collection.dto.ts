import { ObjectType, Field } from '@nestjs/graphql';
import { CollectionApi } from 'src/common';
import { Account } from 'src/modules/accounts/models';
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

  constructor(init?: Partial<Collection>) {
    Object.assign(this, init);
  }

  static fromCollectionApi(collectionApi: CollectionApi) {
    return collectionApi
      ? new Collection({
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
        })
      : null;
  }
}

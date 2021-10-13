import { ObjectType, Field } from '@nestjs/graphql';
import { CollectionApi } from 'src/common/services/elrond-communication/models/collection.dto';
import { Account } from 'src/modules/accounts/models';
import { NftTypeEnum } from 'src/modules/assets/models/NftTypes.enum';

@ObjectType()
export class Collection {
  @Field({ nullable: true })
  collection?: string;
  @Field({ nullable: true })
  type: NftTypeEnum;
  @Field()
  ticker!: string;
  @Field({ nullable: true })
  issuerAddress: string;
  @Field({ nullable: true })
  issuer: Account;
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

  static fromCollectionApi(
    collectionApi: CollectionApi,
    issuerAddress: string = undefined,
  ) {
    console.log({ collectionApi });
    return collectionApi
      ? new Collection({
          collection: collectionApi.collection,
          type: NftTypeEnum[collectionApi.type],
          ticker: collectionApi.ticker,
          issuerAddress: issuerAddress ? issuerAddress : collectionApi.issuer,
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

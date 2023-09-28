import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Collection } from 'src/modules/nftCollections/models';

@ObjectType()
export class CollectionsDetailsModel {
  @Field()
  collectionIdentifier: string;
  @Field()
  collectionName: string;
  @Field()
  owner: string;
  @Field(() => Int)
  items: number;

  constructor(init?: Partial<CollectionsDetailsModel>) {
    Object.assign(this, init);
  }

  static fromApiCollection(collection: Collection) {
    return new CollectionsDetailsModel({
      collectionIdentifier: collection.collection,
      collectionName: collection.name,
      items: collection.nftsCount,
      owner: collection.artistAddress ?? collection.ownerAddress,
    });
  }
}

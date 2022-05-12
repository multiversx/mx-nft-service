import { ObjectType, Field } from '@nestjs/graphql';
import { FeaturedMarketplaceEntity } from 'src/db/featuredMarketplaces';
@ObjectType()
export class FeaturedMarketplace {
  @Field(() => String)
  address: string;

  @Field(() => String)
  url: string;

  constructor(init?: Partial<FeaturedMarketplace>) {
    Object.assign(this, init);
  }

  static fromEntity(entity: FeaturedMarketplaceEntity) {
    return entity
      ? new FeaturedMarketplace({
          address: entity.address,
          url: entity.url,
        })
      : null;
  }
}

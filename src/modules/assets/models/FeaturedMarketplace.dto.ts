import { ObjectType, Field } from '@nestjs/graphql';
import { MarketplaceEntity } from 'src/db/marketplaces';
@ObjectType()
export class Marketplace {
  @Field(() => String)
  address: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  url: string;

  constructor(init?: Partial<Marketplace>) {
    Object.assign(this, init);
  }

  static fromEntity(entity: MarketplaceEntity, identifier: string) {
    return entity && Object.keys(entity).length > 0
      ? new Marketplace({
          address: entity.address,
          name: entity.name,
          url: `${entity.url}${identifier}`,
        })
      : null;
  }
}

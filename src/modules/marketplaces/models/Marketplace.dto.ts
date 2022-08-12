import { ObjectType, Field, ID } from '@nestjs/graphql';
import { MarketplaceEntity } from 'src/db/marketplaces';
import { MarketplaceTypeEnum } from './MarketplaceType.enum';
@ObjectType()
export class Marketplace {
  @Field(() => ID)
  key: string;

  @Field(() => String)
  address: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  url: string;

  @Field(() => MarketplaceTypeEnum)
  type: string;

  constructor(init?: Partial<Marketplace>) {
    Object.assign(this, init);
  }

  static fromEntity(entity: MarketplaceEntity, identifier?: string) {
    return entity && Object.keys(entity).length > 0
      ? new Marketplace({
          address: entity.address,
          name: entity.name,
          url: identifier ? `${entity.url}${identifier}` : entity.url,
          key: entity.key,
        })
      : null;
  }
}

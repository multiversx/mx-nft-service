import { ObjectType, Field } from '@nestjs/graphql';
import { SubdomainEntity } from 'src/db/subdomains';
@ObjectType()
export class InternalMarketplace {
  @Field(() => String)
  name: string;

  @Field(() => String)
  url: string;

  constructor(init?: Partial<InternalMarketplace>) {
    Object.assign(this, init);
  }

  static fromEntity(entity: SubdomainEntity) {
    return entity && Object.keys(entity).length > 0
      ? new InternalMarketplace({
          name: entity.name,
          url: entity.url,
        })
      : null;
  }
}

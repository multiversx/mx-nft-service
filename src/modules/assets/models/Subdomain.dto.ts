import { ObjectType, Field } from '@nestjs/graphql';
import { SubdomainEntity } from 'src/db/subdomains';
@ObjectType()
export class Subdomain {
  @Field(() => String)
  name: string;

  @Field(() => String)
  url: string;

  constructor(init?: Partial<Subdomain>) {
    Object.assign(this, init);
  }

  static fromEntity(entity: SubdomainEntity) {
    return entity && Object.keys(entity).length > 0
      ? new Subdomain({
          name: entity.name,
          url: entity.url,
        })
      : null;
  }
}

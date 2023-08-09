import { Field, ID, ObjectType } from '@nestjs/graphql';
import { MinterEntity } from 'src/db/minters';

@ObjectType()
export class Minter {
  @Field(() => ID)
  address!: string;

  @Field(() => ID)
  adminAddress!: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  description: string;

  constructor(init?: Partial<Minter>) {
    Object.assign(this, init);
  }

  static fromEntity(minter: MinterEntity) {
    return minter
      ? new Minter({
          address: minter.address,
          name: minter.name,
          description: minter.description,
          adminAddress: minter.adminAddress,
        })
      : null;
  }
}

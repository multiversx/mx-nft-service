import { Field, ID, ObjectType } from '@nestjs/graphql';
import { MinterEntity } from 'src/db/minters';

@ObjectType()
export class Minter {
  @Field(() => ID)
  address!: string;

  @Field(() => ID)
  adminAddress!: string;

  constructor(init?: Partial<Minter>) {
    Object.assign(this, init);
  }

  static fromEntity(minter: MinterEntity) {
    return minter
      ? new Minter({
          address: minter.address,
          adminAddress: minter.adminAddress,
        })
      : null;
  }
}

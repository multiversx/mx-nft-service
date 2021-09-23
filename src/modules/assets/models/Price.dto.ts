import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { OrderEntity } from 'src/db/orders/order.entity';

@ObjectType()
export class Price {
  @Field(() => ID)
  token: string;
  @Field()
  amount: string;
  @Field(() => String, { nullable: true })
  usdAmount: string;
  @Field(() => Int)
  nonce: number;

  constructor(init?: Partial<Price>) {
    Object.assign(this, init);
  }

  static fromEntity(entity: OrderEntity): Price {
    return entity
      ? new Price({
          token: entity?.priceToken,
          amount: entity?.priceAmount,
          nonce: entity?.priceNonce,
        })
      : undefined;
  }
}

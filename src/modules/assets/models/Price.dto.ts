import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { OrderEntity } from 'src/db/orders/order.entity';

@ObjectType()
export class Price {
  @Field(() => ID)
  token: string;
  @Field(() => Int)
  timestamp: number;
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
          timestamp: new Date(entity.creationDate).getTime() / 1000,
        })
      : undefined;
  }
}

@ObjectType()
export class MinBid extends Price {}

@ObjectType()
export class MaxBid extends Price {}

@ObjectType()
export class TopBid extends Price {}

@ObjectType()
export class OrderPrice extends Price {}

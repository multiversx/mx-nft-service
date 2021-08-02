import { Field, InputType, Int } from '@nestjs/graphql';
import { OrderEntity } from 'src/db/orders/order.entity';

@InputType()
export class CreateOrderArgs {
  @Field()
  priceToken: string;
  @Field()
  priceAmount: string;
  @Field(() => Int)
  priceNonce: number;
  @Field(() => Int)
  auctionId: number;

  constructor(init?: Partial<CreateOrderArgs>) {
    Object.assign(this, init);
  }

  static toEntity(ownerAddress: string, args: CreateOrderArgs): OrderEntity {
    return new OrderEntity({
      auctionId: args.auctionId,
      ownerAddress: ownerAddress,
      priceToken: args.priceToken,
      priceAmount: args.priceAmount,
      priceNonce: args.priceNonce,
    });
  }
}

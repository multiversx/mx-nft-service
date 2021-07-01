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
  @Field(() => String)
  ownerAddress: string;
  @Field(() => Int)
  auctionId: number;

  static toEntity(args: CreateOrderArgs): OrderEntity {
    return new OrderEntity({
      auctionId: args.auctionId,
      ownerAddress: args.ownerAddress,
      priceToken: args.priceToken,
      priceAmount: args.priceAmount,
      priceNonce: args.priceNonce,
    });
  }
}

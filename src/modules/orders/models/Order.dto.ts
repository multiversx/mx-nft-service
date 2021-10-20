import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { OrderStatusEnum } from './order-status.enum';
import { Auction } from '../../auctions/models';
import { Account } from '../../accounts/models';
import { Price } from '../../assets/models';
import { OrderEntity } from 'src/db/orders';
import { DateUtils } from 'src/utils/date-utils';

@ObjectType()
export class Order {
  @Field(() => ID)
  id: number;

  @Field(() => Int)
  auctionId: number;

  @Field(() => String)
  ownerAddress: string;

  @Field(() => Account, { nullable: true })
  from: Account;

  @Field(() => Auction, { nullable: true })
  auction: Auction;

  @Field(() => Price)
  price: Price;

  @Field(() => OrderStatusEnum)
  status: OrderStatusEnum;

  @Field(() => Int, { nullable: true })
  creationDate: number;

  @Field(() => Int, { nullable: true })
  endDate: number;

  constructor(init?: Partial<Order>) {
    Object.assign(this, init);
  }

  static fromEntity(order: OrderEntity) {
    return order
      ? new Order({
          id: order.id,
          ownerAddress: order.ownerAddress,
          price: new Price({
            amount: order.priceAmount,
            nonce: order.priceNonce,
            token: order.priceToken,
            timestamp: DateUtils.getTimestamp(order.creationDate),
          }),
          status: order.status,
          creationDate: DateUtils.getTimestamp(order.creationDate),
          endDate: DateUtils.getTimestamp(order.modifiedDate),
          auctionId: order.auctionId,
        })
      : null;
  }
}

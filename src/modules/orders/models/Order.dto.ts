import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { OrderStatusEnum } from './Order-status.enum';
import { Auction } from '../../auctions/models';
import { Price } from '../../assets/models';
import { OrderEntity } from 'src/db/orders';
import { DateUtils } from 'src/utils/date-utils';
import { Account } from 'src/modules/account-stats/models';
import { mxConfig } from 'src/config';

@ObjectType()
export class Order {
  @Field(() => ID)
  id: number;

  @Field(() => Int)
  auctionId: number;

  @Field(() => String, { nullable: true })
  boughtTokensNo: string;

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

  @Field(() => String)
  marketplaceKey: string;

  constructor(init?: Partial<Order>) {
    Object.assign(this, init);
  }

  static fromEntity(order: OrderEntity) {
    return order
      ? new Order({
          id: order.id,
          ownerAddress: order.ownerAddress,
          boughtTokensNo: order.boughtTokensNo,
          price: new Price({
            amount: order.priceAmount,
            nonce: order.priceNonce,
            token: order?.priceToken === mxConfig.egld ? mxConfig.egld : order?.priceToken,
            timestamp: DateUtils.getTimestamp(order.creationDate),
          }),
          status: order.status,
          creationDate: DateUtils.getTimestamp(order.creationDate),
          endDate: DateUtils.getTimestamp(order.modifiedDate),
          auctionId: order.auctionId,
          marketplaceKey: order.marketplaceKey,
        })
      : null;
  }
}

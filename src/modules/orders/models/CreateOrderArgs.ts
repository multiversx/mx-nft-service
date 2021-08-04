import { OrderEntity } from 'src/db/orders/order.entity';

export class CreateOrderArgs {
  ownerAddress: string;
  priceToken: string;
  priceAmount: string;
  priceNonce: number;
  auctionId: number;

  constructor(init?: Partial<CreateOrderArgs>) {
    Object.assign(this, init);
  }

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

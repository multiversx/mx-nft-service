import { OrderEntity } from 'src/db/orders/order.entity';

export class CreateOrderArgs {
  priceToken: string;
  priceAmount: string;
  priceNonce: number;
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

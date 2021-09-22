import { OrderEntity } from 'src/db/orders/order.entity';
import denominate from 'src/modules/formatters';

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
      priceAmountDenominated: parseFloat(
        denominate({
          input: args.priceAmount,
          denomination: 18,
          decimals: 18,
          showLastNonZeroDecimal: true,
        }),
      ),
      priceNonce: args.priceNonce,
    });
  }
}

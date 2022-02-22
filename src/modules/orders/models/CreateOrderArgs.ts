import { OrderEntity } from 'src/db/orders';
import denominate from 'src/modules/formatters';
import { OrderStatusEnum } from '.';

export class CreateOrderArgs {
  ownerAddress: string;
  priceToken: string;
  priceAmount: string;
  boughtTokens: string;
  status: OrderStatusEnum;
  blockHash: string;
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
        }).replace(',', ''),
      ),
      priceNonce: args.priceNonce,
      boughtTokensNo: args.boughtTokens,
      blockHash: args.blockHash,
      status: args.status,
    });
  }
}

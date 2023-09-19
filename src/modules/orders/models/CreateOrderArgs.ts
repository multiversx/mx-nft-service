import { OrderEntity } from 'src/db/orders';
import { BigNumberUtils } from 'src/utils/bigNumber-utils';
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
  marketplaceKey: string;

  constructor(init?: Partial<CreateOrderArgs>) {
    Object.assign(this, init);
  }

  static toEntity(args: CreateOrderArgs, decimals: number): OrderEntity {
    return new OrderEntity({
      auctionId: args.auctionId,
      ownerAddress: args.ownerAddress,
      priceToken: args.priceToken,
      priceAmount: args.priceAmount,
      priceAmountDenominated: BigNumberUtils.denominateAmount(args.priceAmount, decimals),
      priceNonce: args.priceNonce,
      boughtTokensNo: args.boughtTokens,
      blockHash: args.blockHash,
      status: args.status,
      marketplaceKey: args.marketplaceKey,
    });
  }
}

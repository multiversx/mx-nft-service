import { Field, ObjectType } from '@nestjs/graphql';
import { mxConfig } from 'src/config';
import { Price } from 'src/modules/assets/models';
import { BigNumberUtils } from 'src/utils/bigNumber-utils';
import { DateUtils } from 'src/utils/date-utils';

@ObjectType()
export class PriceRange {
  @Field(() => Price)
  minBid: Price;

  @Field(() => Price)
  maxBid: Price;

  constructor(init?: Partial<PriceRange>) {
    Object.assign(this, init);
  }

  static fromEntity(minBid: string, maxBid: string, paymentToken: string = mxConfig.egld, paymentDecimals: number = mxConfig.decimals) {
    return new PriceRange({
      minBid: new Price({
        token: paymentToken,
        nonce: 0,
        amount: minBid ? BigNumberUtils.nominateAmount(minBid, paymentDecimals) : '0',
        timestamp: DateUtils.getCurrentTimestamp(),
      }),
      maxBid: new Price({
        token: paymentToken,
        nonce: 0,
        amount: maxBid ? BigNumberUtils.nominateAmount(maxBid, paymentDecimals) : '0',
        timestamp: DateUtils.getCurrentTimestamp(),
      }),
    });
  }
}

import { Field, ObjectType } from '@nestjs/graphql';
import { elrondConfig } from 'src/config';
import { Price } from 'src/modules/assets/models';
import { nominateAmount } from 'src/utils';
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

  static fromEntity(minBid: string, maxBid: string) {
    return new PriceRange({
      minBid: new Price({
        token: elrondConfig.egld,
        nonce: 0,
        amount: minBid ? nominateAmount(minBid) : '0',
        timestamp: DateUtils.getCurrentTimestamp(),
      }),
      maxBid: new Price({
        token: elrondConfig.egld,
        nonce: 0,
        amount: maxBid ? nominateAmount(maxBid) : '0',
        timestamp: DateUtils.getCurrentTimestamp(),
      }),
    });
  }
}

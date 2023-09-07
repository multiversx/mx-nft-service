import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { mxConfig } from 'src/config';
import { OrderEntity } from 'src/db/orders';
import { DateUtils } from 'src/utils/date-utils';
import { Token } from '../../usdPrice/Token.model';

@ObjectType()
export class Price {
  @Field(() => ID)
  token: string;
  @Field(() => Int)
  timestamp: number;
  @Field()
  amount: string;
  @Field(() => String, { nullable: true })
  usdAmount: string;
  @Field(() => Int)
  nonce: number = 0;

  @Field(() => Token)
  tokenData: Token;

  constructor(init?: Partial<Price>) {
    Object.assign(this, init);
  }

  static fromEntity(entity: OrderEntity): Price {
    return entity
      ? new Price({
          token: entity?.priceToken === mxConfig.egld ? mxConfig.egld : entity?.priceToken,
          amount: entity?.priceAmount,
          nonce: entity?.priceNonce,
          timestamp: DateUtils.getTimestamp(entity.creationDate),
        })
      : undefined;
  }
}

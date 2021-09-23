import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Account } from 'src/modules/accounts/models';
import { AssetActionEnum } from './AssetAction.enum';
import { Price } from './Price.dto';
@ObjectType()
export class AssetHistoryLog {
  @Field(() => String)
  address: string;
  @Field(() => Account)
  account: Account;
  @Field(() => AssetActionEnum)
  action!: AssetActionEnum;
  @Field(() => String)
  actionDate: string;
  @Field(() => Int, { nullable: true })
  itemCount: number;
  @Field(() => Price, { nullable: true })
  price: Price;

  constructor(init?: Partial<AssetHistoryLog>) {
    Object.assign(this, init);
  }
}

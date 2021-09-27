import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Account } from 'src/modules/accounts/models';
import { AssetActionEnum } from './AssetAction.enum';
import { AssetHistoryPrice } from './Price.dto';
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
  @Field(() => String, { nullable: true })
  itemCount: string;
  @Field(() => AssetHistoryPrice, { nullable: true })
  price: AssetHistoryPrice;

  constructor(init?: Partial<AssetHistoryLog>) {
    Object.assign(this, init);
  }
}

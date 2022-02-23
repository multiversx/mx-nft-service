import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Account } from 'src/modules/account-stats/models';
import { AssetActionEnum, Price } from 'src/modules/assets/models';
@ObjectType()
export class AssetHistoryLog {
  @Field(() => String)
  address: string;
  @Field(() => Account, { nullable: true })
  account: Account;
  @Field(() => String, { nullable: true })
  senderAddress: string;
  @Field(() => Account, { nullable: true })
  senderAccount: Account;
  @Field(() => AssetActionEnum)
  action!: AssetActionEnum;
  @Field(() => Int)
  actionDate: number;
  @Field(() => String)
  transactionHash: string;
  @Field(() => String, { nullable: true })
  itemCount: string;
  @Field(() => Price, { nullable: true })
  price: Price;

  constructor(init?: Partial<AssetHistoryLog>) {
    Object.assign(this, init);
  }
}

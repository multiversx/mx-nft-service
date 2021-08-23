import { ObjectType, Field, Int } from '@nestjs/graphql';
import { AssetActionEnum } from './AssetAction.enum';
import { Price } from './Price.dto';
@ObjectType()
export class AssetHistoryLog {
  @Field(() => String)
  address: string;
  @Field(() => AssetActionEnum)
  action!: AssetActionEnum;
  @Field(() => String)
  actionDate: string;
  @Field(() => Int)
  itemCount: number;
  @Field(() => Price, { nullable: true })
  price: Price;

  constructor(init?: Partial<AssetHistoryLog>) {
    Object.assign(this, init);
  }
}

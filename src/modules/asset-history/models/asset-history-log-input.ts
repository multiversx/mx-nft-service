import { ObjectType, Field } from '@nestjs/graphql';
import { AssetActionEnum } from 'src/modules/assets/models';

@ObjectType()
export class AssetHistoryInput {
  @Field(() => Object)
  event: any;
  @Field(() => String)
  action: AssetActionEnum;
  @Field(() => String)
  address: string;
  @Field(() => String, { nullable: true })
  itemsCount: string;
  @Field(() => String, { nullable: true })
  price: string;
  @Field(() => String, { nullable: true })
  sender: string;

  constructor(init?: Partial<AssetHistoryInput>) {
    Object.assign(this, init);
  }
}

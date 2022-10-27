import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { PrimarySaleTime } from './PrimarySaleTime';

@ObjectType()
export class PrimarySale {
  @Field(() => ID, { nullable: true })
  collectionIdentifier: string;
  @Field(() => PrimarySaleStatusEnum)
  status: PrimarySaleStatusEnum;
  @Field({ nullable: true })
  frozen: boolean;
  @Field(() => String, { nullable: true })
  price: string;
  @Field()
  paymentToken: string;
  @Field(() => Int)
  maxUnitsPerWallet: number;
  @Field(() => PrimarySaleTime)
  saleTime: PrimarySaleTime;

  constructor(init?: Partial<PrimarySale>) {
    Object.assign(this, init);
  }
}

export enum PrimarySaleStatusEnum {
  ClaimPeriod = 'ClaimPeriod',
  SalePeriod = 'SalePeriod',
  NonePeriod = 'NonePeriod',
}
registerEnumType(PrimarySaleStatusEnum, {
  name: 'PrimarySaleStatusEnum',
});

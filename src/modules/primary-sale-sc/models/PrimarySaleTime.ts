import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { PrimarySaleTimeAbi } from './PrimarySaleTimestamp.abi';

@ObjectType()
export class PrimarySaleTime {
  @Field(() => Int)
  startSale: number;
  @Field(() => Int)
  endSale: number;
  @Field(() => Int, { nullable: true })
  startClaim: number;
  @Field(() => Int, { nullable: true })
  endClaim: number;

  constructor(init?: Partial<PrimarySaleTime>) {
    Object.assign(this, init);
  }

  static fromAbi(abi: PrimarySaleTimeAbi): PrimarySaleTime | undefined {
    return abi
      ? new PrimarySaleTime({
          startSale: parseInt(abi.start_sale.valueOf().toString()),
          endSale: parseInt(abi.end_sale.valueOf().toString()),
          startClaim: parseInt(abi.start_claim.valueOf().toString()),
          endClaim: parseInt(abi.end_claim.valueOf().toString()),
        })
      : undefined;
  }
}

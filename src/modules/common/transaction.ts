import { ObjectType, Field, Int } from '@nestjs/graphql';
@ObjectType()
export class TransactionNode {
  @Field(() => Int)
  nonce: number;
  @Field()
  value: string;
  @Field()
  sender: string;
  @Field()
  receiver: string;
  @Field()
  gasPrice: number;
  @Field()
  gasLimit: number;
  @Field()
  data?: string;
  @Field()
  chainID: string;
  @Field()
  version: number;
  @Field({ nullable: true })
  options?: number;
  signature?: string;
}

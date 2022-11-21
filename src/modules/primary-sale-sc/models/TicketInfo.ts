import { Field, Int, ObjectType } from '@nestjs/graphql';
import { TicketInfoAbi } from './PrimarySaleTimestamp.abi';

@ObjectType()
export class TicketInfo {
  @Field(() => String)
  buyer: string;
  @Field(() => Int)
  ticketNumber: number;
  @Field(() => String)
  winningNonce: string;

  constructor(init?: Partial<TicketInfo>) {
    Object.assign(this, init);
  }

  static fromAbi(abi: TicketInfoAbi): TicketInfo | undefined {
    return abi
      ? new TicketInfo({
          buyer: abi.buyer.valueOf().toString(),
          ticketNumber: parseInt(abi.ticket_number.valueOf().toString()),
          winningNonce: abi.winner_nonce.valueOf().toString(),
        })
      : undefined;
  }
}

@ObjectType()
export class WhitelistedInfo {
  @Field(() => Boolean)
  isWhitelisted: boolean;
  @Field(() => String, { nullable: true })
  message: string;

  constructor(init?: Partial<TicketInfo>) {
    Object.assign(this, init);
  }
}

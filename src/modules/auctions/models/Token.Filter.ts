import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class TokenFilter {
  @Field(() => String)
  token: string = 'EGLD';
  constructor(init?: Partial<TokenFilter>) {
    Object.assign(this, init);
  }
}

import { Field, InputType } from '@nestjs/graphql';
import { elrondConfig } from 'src/config';

@InputType()
export class TokenFilter {
  @Field(() => String)
  token: string = elrondConfig.egld;
  constructor(init?: Partial<TokenFilter>) {
    Object.assign(this, init);
  }
}

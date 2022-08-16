import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class NotificationsFilters {
  @Field(() => String)
  marketplaceKey: string;
  constructor(init?: Partial<NotificationsFilters>) {
    Object.assign(this, init);
  }
}

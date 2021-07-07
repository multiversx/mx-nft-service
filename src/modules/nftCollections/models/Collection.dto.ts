import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class Collection {
  @Field()
  id: number;
  @Field()
  ticker!: string;
  @Field({ nullable: true })
  token?: string;
  @Field()
  name!: string;
  @Field()
  address!: string;
  @Field()
  creationDate: Date;

  constructor(init?: Partial<Collection>) {
    Object.assign(this, init);
  }
}

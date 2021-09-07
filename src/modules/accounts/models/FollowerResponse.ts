import * as Relay from 'graphql-relay';
import { Field, ObjectType } from '@nestjs/graphql';
import PageData from 'src/modules/PageData';
import { PageInfo } from 'src/modules/PageInfo';
import { Account } from './Account.dto';

@ObjectType()
export class FollowerResponse {
  @Field(() => [FollowerResponseEdge], { nullable: true })
  edges: [FollowerResponseEdge];

  @Field(() => PageData, { nullable: true })
  pageData: PageData;

  @Field(() => PageInfo, { nullable: true })
  pageInfo!: Relay.PageInfo;
}

@ObjectType()
export class FollowerResponseEdge {
  @Field(() => String)
  cursor: String;

  @Field(() => Account, { nullable: true })
  node: Account;
}

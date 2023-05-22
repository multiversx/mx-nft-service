import { HistoricalValue } from '@multiversx/sdk-data-api-client';
import { DataApiHistoricalResponse } from '@multiversx/sdk-data-api-client/lib/src/responses';
import { Field, ObjectType } from '@nestjs/graphql';
import BigNumber from 'bignumber.js';
import moment from 'moment';

@ObjectType()
export class Stats {
  @Field()
  nfts: number;
  @Field()
  collections: number;
  @Field()
  holders: number;
  @Field()
  createdLastMonth: number;
  @Field()
  volume: number;
  @Field()
  marketplaces: number;

  constructor(init?: Partial<Stats>) {
    Object.assign(this, init);
  }

}

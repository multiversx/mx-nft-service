import { ObjectType } from '@nestjs/graphql';
import relayTypes from 'src/modules/common/filters/Relay.types';
import { Collection } from '.';
@ObjectType()
export default class CollectionResponse extends relayTypes<Collection>(
  Collection,
) {}

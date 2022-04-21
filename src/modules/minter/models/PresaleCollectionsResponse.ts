import { ObjectType } from '@nestjs/graphql';
import relayTypes from 'src/modules/common/Relay.types';
import { PresaleCollection } from './PresaleCollection.dto';

@ObjectType()
export class PresaleCollectionsResponse extends relayTypes<PresaleCollection>(
  PresaleCollection,
) {}

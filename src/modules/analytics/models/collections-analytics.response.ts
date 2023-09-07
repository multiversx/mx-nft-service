import { ObjectType } from '@nestjs/graphql';
import relayTypes from 'src/modules/common/Relay.types';
import { CollectionsAnalyticsModel } from './collections-stats.model';

@ObjectType()
export class CollectionsAnalyticsResponse extends relayTypes<CollectionsAnalyticsModel>(CollectionsAnalyticsModel) {}

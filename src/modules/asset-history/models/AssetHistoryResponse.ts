import { ObjectType } from '@nestjs/graphql';
import { AssetHistoryLog } from '.';
import relayTypes from '../../Relay.types';
@ObjectType()
export class AssetHistoryResponse extends relayTypes<AssetHistoryLog>(
  AssetHistoryLog,
) {}

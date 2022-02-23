import { ObjectType } from '@nestjs/graphql';
import relayTypes from 'src/modules/common/filters/Relay.types';
import { AssetHistoryLog } from '.';

@ObjectType()
export class AssetHistoryLogResponse extends relayTypes<AssetHistoryLog>(
  AssetHistoryLog,
) {}

import { ObjectType } from '@nestjs/graphql';
import relayTypes from 'src/modules/common/Relay.types';
import { Notification } from './Notification.dto';

@ObjectType()
export class NotificationsResponse extends relayTypes<Notification>(Notification) {}

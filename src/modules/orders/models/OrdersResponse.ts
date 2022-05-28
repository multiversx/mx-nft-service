import { ObjectType } from '@nestjs/graphql';
import relayTypes from 'src/modules/common/Relay.types';
import { Order } from './Order.dto';

@ObjectType()
export class OrdersResponse extends relayTypes<Order>(Order) {}

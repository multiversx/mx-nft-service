import { ObjectType } from '@nestjs/graphql';
import relayTypes from 'src/modules/Relay.types';
import { Order } from './Order.dto';

@ObjectType()
export class OrdersResponse extends relayTypes<Order>(Order) {}

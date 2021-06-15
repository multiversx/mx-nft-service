import { ObjectType } from '@nestjs/graphql';
import relayTypes from '../../Relay.types';
import { Account } from './account.dto';

@ObjectType()
export default class AccountResponse extends relayTypes<Account>(Account) {}

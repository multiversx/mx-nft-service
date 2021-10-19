import { ObjectType } from '@nestjs/graphql';
import relayTypes from '../../Relay.types';
import { Account } from './Account.dto';

@ObjectType()
export class AccountResponse extends relayTypes<Account>(Account) {}

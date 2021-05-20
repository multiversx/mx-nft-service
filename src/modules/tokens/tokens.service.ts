import { Injectable } from '@nestjs/common';
import '../../utils/extentions';
import {
  Address,
  AddressValue,
  Balance,
  BytesValue,
  ContractFunction,
  GasLimit,
  SmartContract,
} from '@elrondnetwork/erdjs';
import { elrondConfig } from 'src/config';
import { SetNftRolesArgs } from './models/SetNftRolesArgs';
import { IssueTokenArgs } from './models';
import { TransactionNode } from '../transaction';

@Injectable()
export class TokensService {
  constructor() {}

  async issueNft(args: IssueTokenArgs): Promise<TransactionNode> {
    const contract = new SmartContract({
      address: new Address(elrondConfig.esdtNftAddress),
    });

    const transaction = contract.call({
      func: new ContractFunction('issueNonFungible'),
      value: Balance.egld(5),
      args: [
        BytesValue.fromUTF8(args.tokenName),
        BytesValue.fromUTF8(args.tokenTicker),
      ],
      gasLimit: new GasLimit(60000000),
    });
    return transaction.toPlainObject();
  }

  async setNftRoles(args: SetNftRolesArgs): Promise<TransactionNode> {
    const contract = new SmartContract({
      address: new Address(elrondConfig.esdtNftAddress),
    });
    const transaction = contract.call({
      func: new ContractFunction('setSpecialRole'),
      value: Balance.egld(0),
      args: [
        BytesValue.fromUTF8(args.tokenIdentifier),
        new AddressValue(new Address(args.addressToTransfer)),
        BytesValue.fromUTF8(args.role),
      ],
      gasLimit: new GasLimit(60000000),
    });
    return transaction.toPlainObject();
  }
}

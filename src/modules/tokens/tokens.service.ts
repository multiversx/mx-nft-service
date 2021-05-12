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
import { TransactionNode } from '../nfts/dto/transaction';
import { elrondConfig } from 'src/config';

@Injectable()
export class TokensService {
  constructor() {}

  async issueNft(
    token_name: string,
    token_ticker: string,
  ): Promise<TransactionNode> {
    const contract = new SmartContract({
      address: new Address(elrondConfig.esdtNftAddress),
    });

    const transaction = contract.call({
      func: new ContractFunction('issueNonFungible'),
      value: Balance.egld(5),
      args: [
        BytesValue.fromUTF8(token_name),
        BytesValue.fromUTF8(token_ticker),
      ],
      gasLimit: new GasLimit(60000000),
    });
    return transaction.toPlainObject();
  }

  async setNftRoles(
    token_identifier: string,
    address_transfer: string,
    role: string,
  ): Promise<TransactionNode> {
    const contract = new SmartContract({
      address: new Address(elrondConfig.esdtNftAddress),
    });
    const transaction = contract.call({
      func: new ContractFunction('setSpecialRole'),
      value: Balance.egld(0),
      args: [
        BytesValue.fromUTF8(token_identifier),
        new AddressValue(new Address(address_transfer)),
        BytesValue.fromUTF8(role),
      ],
      gasLimit: new GasLimit(60000000),
    });
    return transaction.toPlainObject();
  }
}

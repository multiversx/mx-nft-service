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
  TypedValue,
} from '@elrondnetwork/erdjs';
import { elrondConfig, gas } from 'src/config';
import { SetNftRolesArgs } from './models/SetNftRolesArgs';
import {
  IssueTokenArgs,
  StopNftCreateArgs,
  TransferNftCreateRoleArgs,
} from './models';
import { TransactionNode } from '../transaction';

@Injectable()
export class TokensService {
  constructor() {}

  private readonly esdtSmartContract = new SmartContract({
    address: new Address(elrondConfig.esdtNftAddress),
  });

  async issueNft(args: IssueTokenArgs): Promise<TransactionNode> {
    return this.issueToken(args, 'issueNonFungible');
  }

  async issueSemiFungible(args: IssueTokenArgs): Promise<TransactionNode> {
    return this.issueToken(args, 'issueSemiFungible');
  }

  async stopNFTCreate(args: StopNftCreateArgs): Promise<TransactionNode> {
    const smartContract = this.getSmartContract(args.ownerAddress);
    const transaction = smartContract.call({
      func: new ContractFunction('stopNFTCreate'),
      value: Balance.egld(0),
      args: [BytesValue.fromUTF8(args.token)],
      gasLimit: new GasLimit(gas.stopNFTCreate),
    });
    return transaction.toPlainObject();
  }

  async transferNFTCreateRole(
    args: TransferNftCreateRoleArgs,
  ): Promise<TransactionNode> {
    const smartContract = this.getSmartContract(args.ownerAddress);
    let transactionArgs = this.getTransferCreateRoleArgs(args);
    const transaction = smartContract.call({
      func: new ContractFunction('transferNFTCreateRole'),
      value: Balance.egld(0),
      args: transactionArgs,
      gasLimit: new GasLimit(gas.transferNFTCreateRole),
    });
    return transaction.toPlainObject();
  }

  async setNftRoles(args: SetNftRolesArgs): Promise<TransactionNode> {
    let transactionArgs = this.getSetRolesArgs(args);
    const transaction = this.esdtSmartContract.call({
      func: new ContractFunction('setSpecialRole'),
      value: Balance.egld(0),
      args: transactionArgs,
      gasLimit: new GasLimit(gas.setRoles),
    });
    return transaction.toPlainObject();
  }

  private getSmartContract(address: string) {
    return new SmartContract({
      address: new Address(address),
    });
  }

  private issueToken(args: IssueTokenArgs, functionName: string) {
    let transactionArgs = this.getIssueTokenArguments(args);

    const transaction = this.esdtSmartContract.call({
      func: new ContractFunction(functionName),
      value: Balance.fromString(elrondConfig.issueNftCost),
      args: transactionArgs,
      gasLimit: new GasLimit(gas.issueToken),
    });
    return transaction.toPlainObject();
  }

  private getIssueTokenArguments(args: IssueTokenArgs) {
    let transactionArgs = [
      BytesValue.fromUTF8(args.tokenName),
      BytesValue.fromUTF8(args.tokenTicker),
    ];
    if (args.canFreeze) {
      transactionArgs.push(BytesValue.fromUTF8('canFreeze'));
      transactionArgs.push(BytesValue.fromUTF8(args.canFreeze.toString()));
    }
    if (args.canWipe) {
      transactionArgs.push(BytesValue.fromUTF8('canWipe'));
      transactionArgs.push(BytesValue.fromUTF8(args.canWipe.toString()));
    }
    if (args.canPause) {
      transactionArgs.push(BytesValue.fromUTF8('canPause'));
      transactionArgs.push(BytesValue.fromUTF8(args.canPause.toString()));
    }
    if (args.canTransferNFTCreateRole) {
      transactionArgs.push(BytesValue.fromUTF8('canTransferNFTCreateRole'));
      transactionArgs.push(
        BytesValue.fromUTF8(args.canTransferNFTCreateRole.toString()),
      );
    }
    return transactionArgs;
  }

  private getSetRolesArgs(args: SetNftRolesArgs) {
    let transactionArgs = [
      BytesValue.fromUTF8(args.token),
      new AddressValue(new Address(args.addressToTransfer)),
    ];
    args.roles.forEach((role) => {
      transactionArgs.push(BytesValue.fromUTF8(role));
    });
    return transactionArgs;
  }

  private getTransferCreateRoleArgs(args: TransferNftCreateRoleArgs) {
    let transactionArgs: TypedValue[] = [BytesValue.fromUTF8(args.token)];
    args.addressToTransferList.forEach((address) => {
      transactionArgs.push(new AddressValue(new Address(address)));
    });
    return transactionArgs;
  }
}

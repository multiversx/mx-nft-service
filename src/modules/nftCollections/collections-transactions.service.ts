import { Injectable } from '@nestjs/common';
import { Address, AddressValue, BytesValue, ContractFunction, TokenTransfer, TypedValue } from '@multiversx/sdk-core';
import { mxConfig, gas } from 'src/config';
import { SetNftRolesArgs } from './models/SetNftRolesArgs';
import { getSmartContract } from 'src/common';
import { TransactionNode } from '../common/transaction';
import { IssueCollectionRequest, StopNftCreateRequest, TransferNftCreateRoleRequest, SetNftRolesRequest } from './models/requests';

@Injectable()
export class CollectionsTransactionsService {
  async issueToken(ownerAddress: string, request: IssueCollectionRequest) {
    let transactionArgs = this.getIssueTokenArguments(request);

    const transaction = this.esdtSmartContract.call({
      func: new ContractFunction(request.collectionType),
      value: TokenTransfer.egldFromBigInteger(mxConfig.issueNftCost),
      args: transactionArgs,
      gasLimit: gas.issueToken,
      chainID: mxConfig.chainID,
      caller: Address.fromString(ownerAddress),
    });
    return transaction.toPlainObject();
  }

  async stopNFTCreate(ownerAddress: string, request: StopNftCreateRequest): Promise<TransactionNode> {
    const smartContract = getSmartContract(request.ownerAddress);

    return smartContract.methodsExplicit
      .stopNFTCreate([BytesValue.fromUTF8(request.collection)])
      .withSender(Address.fromString(ownerAddress))
      .withChainID(mxConfig.chainId)
      .withValue(TokenTransfer.egldFromAmount(0))
      .withGasLimit(gas.stopNFTCreate)
      .buildTransaction()
      .toPlainObject();
  }

  async transferNFTCreateRole(ownerAddress: string, request: TransferNftCreateRoleRequest): Promise<TransactionNode> {
    const smartContract = getSmartContract(request.ownerAddress);

    return smartContract.methodsExplicit
      .transferNFTCreateRole(this.getTransferCreateRoleArgs(request))
      .withSender(Address.fromString(ownerAddress))
      .withChainID(mxConfig.chainId)
      .withValue(TokenTransfer.egldFromAmount(0))
      .withGasLimit(gas.transferNFTCreateRole)
      .buildTransaction()
      .toPlainObject();
  }

  async setNftRoles(ownerAddress: string, args: SetNftRolesRequest): Promise<TransactionNode> {
    return this.esdtSmartContract.methodsExplicit
      .setSpecialRole(this.getSetRolesArgs(args))
      .withSender(Address.fromString(ownerAddress))
      .withChainID(mxConfig.chainId)
      .withValue(TokenTransfer.egldFromAmount(0))
      .withGasLimit(gas.setRoles)
      .buildTransaction()
      .toPlainObject();
  }

  private getIssueTokenArguments(args: IssueCollectionRequest) {
    let transactionArgs = [BytesValue.fromUTF8(args.tokenName), BytesValue.fromUTF8(args.tokenTicker)];
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
      transactionArgs.push(BytesValue.fromUTF8(args.canTransferNFTCreateRole.toString()));
    }
    return transactionArgs;
  }

  private getSetRolesArgs(args: SetNftRolesArgs) {
    let transactionArgs = [BytesValue.fromUTF8(args.collection), new AddressValue(new Address(args.addressToTransfer))];
    args.roles.forEach((role) => {
      transactionArgs.push(BytesValue.fromUTF8(role));
    });
    return transactionArgs;
  }

  private getTransferCreateRoleArgs(args: TransferNftCreateRoleRequest) {
    let transactionArgs: TypedValue[] = [BytesValue.fromUTF8(args.collection)];
    args.addressToTransferList.forEach((address) => {
      transactionArgs.push(new AddressValue(new Address(address)));
    });
    return transactionArgs;
  }

  private readonly esdtSmartContract = getSmartContract(mxConfig.esdtNftAddress);
}

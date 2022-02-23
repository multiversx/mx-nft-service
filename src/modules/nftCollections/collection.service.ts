import { Injectable } from '@nestjs/common';
import '../../utils/extentions';
import {
  Address,
  AddressValue,
  Balance,
  BytesValue,
  ContractFunction,
  GasLimit,
  TypedValue,
} from '@elrondnetwork/erdjs';
import { elrondConfig, gas } from 'src/config';
import { SetNftRolesArgs } from './models/SetNftRolesArgs';
import {
  Collection,
  IssueCollectionArgs,
  StopNftCreateArgs,
  TransferNftCreateRoleArgs,
} from './models';
import { CollectionQuery } from './collection-query';
import { CollectionApi, ElrondApiService, getSmartContract } from 'src/common';
import { TransactionNode } from '../common/transaction';
import { CollectionsFilter } from '../common/filters/filtersTypes';

@Injectable()
export class CollectionsService {
  constructor(private apiService: ElrondApiService) {}

  private readonly esdtSmartContract = getSmartContract(
    elrondConfig.esdtNftAddress,
  );

  async issueNft(args: IssueCollectionArgs): Promise<TransactionNode> {
    return this.issueToken(args, 'issueNonFungible');
  }

  async issueSemiFungible(args: IssueCollectionArgs): Promise<TransactionNode> {
    return this.issueToken(args, 'issueSemiFungible');
  }

  async stopNFTCreate(args: StopNftCreateArgs): Promise<TransactionNode> {
    const smartContract = getSmartContract(args.ownerAddress);
    const transaction = smartContract.call({
      func: new ContractFunction('stopNFTCreate'),
      value: Balance.egld(0),
      args: [BytesValue.fromUTF8(args.collection)],
      gasLimit: new GasLimit(gas.stopNFTCreate),
    });
    return transaction.toPlainObject();
  }

  async transferNFTCreateRole(
    args: TransferNftCreateRoleArgs,
  ): Promise<TransactionNode> {
    const smartContract = getSmartContract(args.ownerAddress);
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

  async getCollections(
    offset: number = 0,
    limit: number = 10,
    filters: CollectionsFilter,
  ): Promise<[Collection[], number]> {
    const apiQuery = new CollectionQuery()
      .addCreator(filters?.creatorAddress)
      .addType(filters?.type)
      .addCanCreate(filters?.canCreate)
      .addPageSize(offset, limit)
      .build();

    if (filters?.ownerAddress) {
      const [collections, count] = await this.getCollectionsForUser(
        filters,
        apiQuery,
      );
      return [
        collections?.map((element) => Collection.fromCollectionApi(element)),
        count,
      ];
    }

    return await this.getAllCollections(filters, apiQuery);
  }

  private async getAllCollections(
    filters: CollectionsFilter,
    query: string = '',
  ): Promise<[Collection[], number]> {
    if (filters?.collection) {
      const collection = await this.apiService.getCollectionForIdentifier(
        filters.collection,
      );
      return [
        [Collection.fromCollectionApi(collection)],
        Collection.fromCollectionApi(collection) ? 1 : 0,
      ];
    }
    const [collectionsApi, count] = await Promise.all([
      this.apiService.getCollections(query),
      this.apiService.getCollectionsCount(query),
    ]);
    const collections = collectionsApi?.map((element) =>
      Collection.fromCollectionApi(element),
    );
    return [collections, count];
  }

  private async getCollectionsForUser(
    filters: CollectionsFilter,
    query: string = '',
  ): Promise<[CollectionApi[], number]> {
    if (filters?.collection) {
      const collection =
        await this.apiService.getCollectionForOwnerAndIdentifier(
          filters.ownerAddress,
          filters.collection,
        );
      return [[collection], collection ? 1 : 0];
    }
    const [collectionsApi, count] = await Promise.all([
      this.apiService.getCollectionsForAddress(filters.ownerAddress, query),
      this.apiService.getCollectionsForAddressCount(
        filters.ownerAddress,
        query,
      ),
    ]);
    return [collectionsApi, count];
  }

  private issueToken(args: IssueCollectionArgs, functionName: string) {
    let transactionArgs = this.getIssueTokenArguments(args);

    const transaction = this.esdtSmartContract.call({
      func: new ContractFunction(functionName),
      value: Balance.fromString(elrondConfig.issueNftCost),
      args: transactionArgs,
      gasLimit: new GasLimit(gas.issueToken),
    });
    return transaction.toPlainObject();
  }

  private getIssueTokenArguments(args: IssueCollectionArgs) {
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
      BytesValue.fromUTF8(args.collection),
      new AddressValue(new Address(args.addressToTransfer)),
    ];
    args.roles.forEach((role) => {
      transactionArgs.push(BytesValue.fromUTF8(role));
    });
    return transactionArgs;
  }

  private getTransferCreateRoleArgs(args: TransferNftCreateRoleArgs) {
    let transactionArgs: TypedValue[] = [BytesValue.fromUTF8(args.collection)];
    args.addressToTransferList.forEach((address) => {
      transactionArgs.push(new AddressValue(new Address(address)));
    });
    return transactionArgs;
  }
}

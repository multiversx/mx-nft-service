import {
  Address,
  SemiFungibleSpecialRoleInput,
  SpecialRoleInput,
  TokenManagementTransactionsFactory,
  TransactionsFactoryConfig,
} from '@multiversx/sdk-core';
import { Injectable } from '@nestjs/common';
import { MxApiService } from 'src/common';
import { mxConfig } from 'src/config';
import { NftTypeEnum } from '../assets/models';
import { TransactionNode } from '../common/transaction';
import { IssueCollectionRequest, SetNftRolesRequest } from './models/requests';

@Injectable()
export class CollectionsTransactionsService {
  constructor(private apiService: MxApiService) {}
  async issueToken(ownerAddress: string, request: IssueCollectionRequest) {
    const factory = new TokenManagementTransactionsFactory({ config: new TransactionsFactoryConfig({ chainID: mxConfig.chainID }) });
    if (request.collectionType === 'issueNonFungible') {
      const transaction = factory.createTransactionForIssuingNonFungible(Address.newFromBech32(ownerAddress), {
        tokenName: request.tokenName,
        tokenTicker: request.tokenTicker,
        canFreeze: request.canFreeze,
        canWipe: request.canWipe,
        canPause: request.canPause,
        canTransferNFTCreateRole: request.canTransferNFTCreateRole,
        canChangeOwner: request.canChangeOwner,
        canUpgrade: request.canUpgrade,
        canAddSpecialRoles: request.canAddSpecialRoles,
      });
      return transaction.toPlainObject();
    }
    const transaction = factory.createTransactionForIssuingSemiFungible(Address.newFromBech32(ownerAddress), {
      tokenName: request.tokenName,
      tokenTicker: request.tokenTicker,
      canFreeze: request.canFreeze,
      canWipe: request.canWipe,
      canPause: request.canPause,
      canTransferNFTCreateRole: request.canTransferNFTCreateRole,
      canChangeOwner: request.canChangeOwner,
      canUpgrade: request.canUpgrade,
      canAddSpecialRoles: request.canAddSpecialRoles,
    });
    return transaction.toPlainObject();
  }

  async setNftRoles(ownerAddress: string, args: SetNftRolesRequest): Promise<TransactionNode> {
    const factory = new TokenManagementTransactionsFactory({
      config: new TransactionsFactoryConfig({ chainID: mxConfig.chainID }),
    });

    const collection = await this.apiService.getCollectionForIdentifier(args.collection);
    const userAddress = Address.newFromBech32(ownerAddress);

    if (collection.type === NftTypeEnum.NonFungibleESDT) {
      const nftInput: SpecialRoleInput = {
        user: userAddress,
        tokenIdentifier: args.collection,
        addRoleNFTCreate: args.roles.includes('ESDTRoleNFTCreate'),
        addRoleNFTBurn: args.roles.includes('ESDTRoleNFTBurn'),
        addRoleNFTUpdateAttributes: args.roles.includes('ESDTRoleNFTUpdateAttributes'),
        addRoleNFTAddURI: args.roles.includes('ESDTRoleNFTAddURI'),
        addRoleESDTTransferRole: args.roles.includes('ESDTTransferRole'),
        addRoleESDTModifyCreator: args.roles.includes('ESDTRoleModifyCreator'),
        addRoleNFTRecreate: args.roles.includes('ESDTRoleNFTRecreate'),
        addRoleESDTModifyRoyalties: args.roles.includes('ESDTRoleModifyRoyalties'),
      };

      return factory.createTransactionForSettingSpecialRoleOnNonFungibleToken(userAddress, nftInput).toPlainObject();
    }

    const sftInput: SemiFungibleSpecialRoleInput = {
      user: userAddress,
      tokenIdentifier: args.collection,
      addRoleNFTCreate: args.roles.includes('ESDTRoleNFTCreate'),
      addRoleNFTBurn: args.roles.includes('ESDTRoleNFTBurn'),
      addRoleESDTTransferRole: args.roles.includes('ESDTTransferRole'),
      addRoleNFTAddQuantity: args.roles.includes('ESDTRoleNFTAddQuantity'),
    };

    return factory.createTransactionForSettingSpecialRoleOnSemiFungibleToken(userAddress, sftInput).toPlainObject();
  }
}

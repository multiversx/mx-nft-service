import { Injectable } from '@nestjs/common';
import '../../utils/extensions';
import BigNumber from 'bignumber.js';
import {
  Address,
  BigUIntValue,
  BytesValue,
  ContractFunction,
  TokenPayment,
  U32Value,
  U64Value,
} from '@elrondnetwork/erdjs';
import { elrondConfig, gas } from '../../config';
import { TransactionNode } from '../common/transaction';
import { ContractLoader } from '@elrondnetwork/erdnest/lib/src/sc.interactions/contract.loader';
import { BuyTicketsArgs, ClaimTicketsArgs } from './models';
import { ConfigureCollectionArgs } from './models/ConfigureCollectionForSaleArgs';
import { SetSaleClaimPeriodArgs } from './models/SetSaleAndClaimTimePeriodArgs';

@Injectable()
export class PrimarySaleService {
  private contract = new ContractLoader(
    './src/abis/primary-sales-sc.abi.json',
    'Sales',
  );

  async buyTicket(
    ownerAddress: string,
    request: BuyTicketsArgs,
  ): Promise<TransactionNode> {
    const contract = await this.contract.getContract(
      process.env.HOLORIDE_PRIMARY_SC,
    );
    let bid = contract.call({
      func: new ContractFunction('buy_tickets'),
      value: TokenPayment.egldFromBigInteger(request.price),
      args: [
        BytesValue.fromUTF8(request.collectionName),
        new U32Value(new BigNumber(request.ticketsNumber)),
      ],
      gasLimit: gas.bid,
      chainID: elrondConfig.chainID,
    });
    return bid.toPlainObject(new Address(ownerAddress));
  }

  async claim(
    ownerAddress: string,
    request: ClaimTicketsArgs,
  ): Promise<TransactionNode> {
    const contract = await this.contract.getContract(
      process.env.HOLORIDE_PRIMARY_SC,
    );

    let withdraw = contract.call({
      func: new ContractFunction('claim'),
      value: TokenPayment.egldFromAmount(0),
      args: [BytesValue.fromUTF8(request.collectionName)],
      gasLimit: gas.withdraw,
      chainID: elrondConfig.chainID,
    });
    return withdraw.toPlainObject(new Address(ownerAddress));
  }

  async configureCollection(
    ownerAddress: string,
    request: ConfigureCollectionArgs,
  ): Promise<TransactionNode> {
    const contract = await this.contract.getContract(
      process.env.HOLORIDE_PRIMARY_SC,
    );
    let bid = contract.call({
      func: new ContractFunction('configure_collection_for_sale'),
      value: TokenPayment.egldFromBigInteger(0),
      args: [
        BytesValue.fromUTF8(request.collectionName),
        new BigUIntValue(new BigNumber(request.price)),
        new U32Value(new BigNumber(request.maxNftsPerWallet)),
      ],
      gasLimit: gas.bid,
      chainID: elrondConfig.chainID,
    });
    return bid.toPlainObject(new Address(ownerAddress));
  }

  async setSaleTime(
    ownerAddress: string,
    request: SetSaleClaimPeriodArgs,
  ): Promise<TransactionNode> {
    const contract = await this.contract.getContract(
      process.env.HOLORIDE_PRIMARY_SC,
    );
    let bid = contract.call({
      func: new ContractFunction('set_sale_timestamps'),
      value: TokenPayment.egldFromBigInteger(0),
      args: [
        BytesValue.fromUTF8(request.collectionName),
        new U64Value(new BigNumber(request.startSale)),
        new U64Value(new BigNumber(request.endSale)),
        new U64Value(new BigNumber(request.startClaim)),
        new U64Value(new BigNumber(request.endClaim)),
      ],
      gasLimit: gas.bid,
      chainID: elrondConfig.chainID,
    });
    return bid.toPlainObject(new Address(ownerAddress));
  }
}

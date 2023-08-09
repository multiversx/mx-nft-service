import { Injectable, Logger } from '@nestjs/common';
import '../../utils/extensions';
import BigNumber from 'bignumber.js';
import {
  Address,
  AddressValue,
  BytesValue,
  ContractFunction,
  Interaction,
  ResultsParser,
  TokenIdentifierValue,
  TokenPayment,
  U32Value,
} from '@multiversx/sdk-core';
import { mxConfig, gas } from '../../config';
import { TransactionNode } from '../common/transaction';
import { ContractLoader } from '@multiversx/sdk-nestjs/lib/src/sc.interactions/contract.loader';
import { BuyTicketsArgs, ClaimTicketsArgs } from './models';
import { MxProxyService, getSmartContract } from 'src/common';
import { PrimarySaleTimeAbi, TicketInfoAbi } from './models/PrimarySaleTimestamp.abi';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { PrimarySale, PrimarySaleStatusEnum } from './models/PrimarySale.dto';
import { PrimarySaleTime } from './models/PrimarySaleTime';
import { TicketInfo } from './models/TicketInfo';
import { DateUtils } from 'src/utils/date-utils';
import { Constants, RedisCacheService } from '@multiversx/sdk-nestjs';

@Injectable()
export class PrimarySaleService {
  private contract = new ContractLoader('./src/abis/primary-sales-sc.abi.json', 'Sales');
  private readonly parser: ResultsParser;

  constructor(private mxProxyService: MxProxyService, private redisCacheService: RedisCacheService, private logger: Logger) {
    this.parser = new ResultsParser();
  }

  async getStatus(collectionIdentifier: string): Promise<PrimarySale> {
    try {
      const saleTime = await this.getTimestamps(collectionIdentifier);
      return await this.getStatusMap(collectionIdentifier, saleTime);
    } catch (err) {
      this.logger.error('An error occurred while getting the status.', {
        path: this.getStatus.name,
        collectionIdentifier,
        exception: err,
      });
    }
  }

  async getStatusMap(collectionIdentifier: string, saleTime: PrimarySaleTime): Promise<PrimarySale> {
    if (saleTime.startSale > DateUtils.getCurrentTimestamp()) {
      return new PrimarySale({
        status: PrimarySaleStatusEnum.NotStarted,
        collectionIdentifier: collectionIdentifier,
      });
    }
    if (saleTime.startSale <= DateUtils.getCurrentTimestamp() && saleTime.endSale > DateUtils.getCurrentTimestamp()) {
      return new PrimarySale({
        status: PrimarySaleStatusEnum.SalePeriod,
        collectionIdentifier: collectionIdentifier,
      });
    }

    if (saleTime.endSale <= DateUtils.getCurrentTimestamp() && saleTime.startClaim > DateUtils.getCurrentTimestamp()) {
      return new PrimarySale({
        status: PrimarySaleStatusEnum.BetweenPeriod,
        collectionIdentifier: collectionIdentifier,
      });
    }
    if (saleTime.startClaim <= DateUtils.getCurrentTimestamp() && saleTime.endClaim > DateUtils.getCurrentTimestamp()) {
      return new PrimarySale({
        status: PrimarySaleStatusEnum.ClaimPeriod,
        collectionIdentifier: collectionIdentifier,
      });
    }
    if (saleTime.endClaim <= DateUtils.getCurrentTimestamp()) {
      return new PrimarySale({
        status: PrimarySaleStatusEnum.EndedPeriod,
        collectionIdentifier: collectionIdentifier,
      });
    }
    return new PrimarySale({
      status: PrimarySaleStatusEnum.NonePeriod,
      collectionIdentifier: collectionIdentifier,
    });
  }

  async getPricePerTicket(collectionIdentifier: string): Promise<string> {
    try {
      const cacheKey = generateCacheKeyFromParams('primarySaleCollectionPrice', collectionIdentifier);
      return await this.redisCacheService.getOrSet(
        cacheKey,
        () => this.getPricePerTicketMap(collectionIdentifier),
        5 * Constants.oneSecond(),
      );
    } catch (err) {
      this.logger.error('An error occurred while getting price per ticket.', {
        path: this.getPricePerTicket.name,
        collectionIdentifier,
        exception: err,
      });
    }
  }

  async getPricePerTicketMap(collectionIdentifier: string): Promise<string> {
    const contract = await this.contract.getContract(process.env.HOLORIDE_PRIMARY_SC);
    let price = <Interaction>contract.methodsExplicit.price([BytesValue.fromUTF8(collectionIdentifier)]);

    const response = await this.getFirstQueryResult(price);
    return response.firstValue.valueOf();
  }

  async getMaxNftPerWallet(collectionIdentifier: string): Promise<string> {
    try {
      const cacheKey = generateCacheKeyFromParams('primarySaleMaxNftWallet', collectionIdentifier);
      return await this.redisCacheService.getOrSet(
        cacheKey,
        () => this.getMaxNftPerWalletMap(collectionIdentifier),
        5 * Constants.oneSecond(),
      );
    } catch (err) {
      this.logger.error('An error occurred while getting the max nfts per wallet.', {
        path: this.getMaxNftPerWallet.name,
        collectionIdentifier,
        exception: err,
      });
    }
  }

  async getMaxNftPerWalletMap(collectionIdentifier: string): Promise<string> {
    const contract = await this.contract.getContract(process.env.HOLORIDE_PRIMARY_SC);
    let maxNftPerWalletInteraction = <Interaction>(
      contract.methodsExplicit.max_units_per_wallet([BytesValue.fromUTF8(collectionIdentifier)])
    );

    const response = await this.getFirstQueryResult(maxNftPerWalletInteraction);
    return response.firstValue.valueOf().toFixed();
  }

  async getTimestamps(collectionIdentifier: string): Promise<PrimarySaleTime> {
    try {
      const cacheKey = generateCacheKeyFromParams('primarySaleTimestamp', collectionIdentifier);
      return await this.redisCacheService.getOrSet(cacheKey, () => this.getTimestampsMap(collectionIdentifier), 5 * Constants.oneSecond());
    } catch (err) {
      this.logger.error('An error occurred while getting timestamp.', {
        path: this.getTimestampsMap.name,
        collectionIdentifier,
        exception: err,
      });
    }
  }

  async getMyTickets(collectionIdentifier: string, address: string): Promise<TicketInfo[]> {
    try {
      const cacheKey = generateCacheKeyFromParams('myTickets', address, collectionIdentifier);
      return await this.redisCacheService.getOrSet(
        cacheKey,
        () => this.getMyTicketsMap(collectionIdentifier, address),
        5 * Constants.oneSecond(),
      );
    } catch (err) {
      this.logger.error('An error occurred while getting timestamp.', {
        path: this.getMyTickets.name,
        collectionIdentifier,
        exception: err,
      });
    }
  }

  async getClaimStatus(collectionIdentifier: string, address: string): Promise<[boolean, number]> {
    const contract = await this.contract.getContract(process.env.HOLORIDE_PRIMARY_SC);
    let myTicketsInteraction = <Interaction>contract.methodsExplicit.claimers([new TokenIdentifierValue(collectionIdentifier)]);

    const response = await this.getFirstQueryResult(myTicketsInteraction);
    const addresses: Address[] = response?.firstValue?.valueOf();
    const claimmers = addresses.map((x) => x.bech32());
    if (claimmers.includes(address)) {
      return [true, Constants.oneHour()];
    }
    return [false, Constants.oneSecond()];
  }

  async getMyTicketsMap(collectionIdentifier: string, address: string): Promise<TicketInfo[]> {
    const contract = await this.contract.getContract(process.env.HOLORIDE_PRIMARY_SC);
    let myTicketsInteraction = <Interaction>(
      contract.methodsExplicit.all_tickets([new AddressValue(new Address(address)), new TokenIdentifierValue(collectionIdentifier)])
    );

    const response = await this.getFirstQueryResult(myTicketsInteraction);
    const myTickets: TicketInfoAbi[] = response?.firstValue?.valueOf();
    return myTickets?.map((t) => TicketInfo.fromAbi(t));
  }

  async isWhitelisted(address: string): Promise<{ isWhitelisted: boolean; message?: string }> {
    try {
      const cacheKey = generateCacheKeyFromParams('isWhitelisted', address);
      return await this.redisCacheService.getOrSet(cacheKey, () => this.isWhitelistedMap(address), 5 * Constants.oneSecond());
    } catch (err) {
      this.logger.error('An error occurred while getting is whitelisted.', {
        path: this.isWhitelisted.name,
        exception: err,
      });
    }
  }

  async hasClaimedTickets(collectionIdentifier: string, address: string): Promise<boolean> {
    try {
      const cacheKey = generateCacheKeyFromParams('hasClaimedTickets', address, collectionIdentifier);
      const cachedValue = await this.redisCacheService.get<boolean>(cacheKey);
      if (cachedValue) {
        return cachedValue;
      }
      const [value, ttl] = await this.getClaimStatus(collectionIdentifier, address);
      await this.redisCacheService.set(cacheKey, value, ttl);
      return value;
    } catch (err) {
      this.logger.error('An error occurred while getting has claimed status.', {
        path: this.hasClaimedTickets.name,
        exception: err,
      });
    }
  }

  async isWhitelistedMap(address: string): Promise<{ isWhitelisted: boolean; message?: string }> {
    const contract = getSmartContract(process.env.HOLORIDE_WHITELIST_SC);
    const func = new ContractFunction('in_whitelist');
    const args = [new AddressValue(new Address(address))];
    const query = new Interaction(contract, func, args).withQuerent(new Address(address)).buildQuery();

    const queryResponse = await this.mxProxyService.getService().queryContract(query);

    const value =
      queryResponse?.returnData && queryResponse.returnData.length > 0
        ? new Boolean(queryResponse.returnData[0].base64ToHex()).valueOf()
        : false;
    if (value === false) {
      return {
        isWhitelisted: false,
        message: process.env.HOLORIDE_WHITELIST_MSG,
      };
    }
    return {
      isWhitelisted: true,
    };
  }

  async getTimestampsMap(collectionIdentifier: string): Promise<PrimarySaleTime> {
    const contract = await this.contract.getContract(process.env.HOLORIDE_PRIMARY_SC);
    let price = <Interaction>contract.methodsExplicit.timestamps([BytesValue.fromUTF8(collectionIdentifier)]);

    const response = await this.getFirstQueryResult(price);
    const saleTime: PrimarySaleTimeAbi = response?.firstValue?.valueOf();
    return PrimarySaleTime.fromAbi(saleTime);
  }

  async buyTicket(ownerAddress: string, request: BuyTicketsArgs): Promise<TransactionNode> {
    const contract = await this.contract.getContract(process.env.HOLORIDE_PRIMARY_SC);

    return contract.methodsExplicit
      .buy_tickets([BytesValue.fromUTF8(request.collectionIdentifier), new U32Value(new BigNumber(request.ticketsNumber))])
      .withSingleESDTTransfer(TokenPayment.fungibleFromBigInteger(process.env.HOLORIDE_PAYMENT_TOKEN, new BigNumber(request.price)))
      .withChainID(mxConfig.chainID)
      .withGasLimit(gas.buyTickets)
      .withSender(new Address(ownerAddress))
      .buildTransaction()
      .toPlainObject();
  }

  async claim(ownerAddress: string, request: ClaimTicketsArgs): Promise<TransactionNode> {
    const contract = await this.contract.getContract(process.env.HOLORIDE_PRIMARY_SC);
    return contract.methodsExplicit
      .claim([new TokenIdentifierValue(request.collectionIdentifier)])
      .withValue(TokenPayment.egldFromAmount(0))
      .withChainID(mxConfig.chainID)
      .withGasLimit(gas.withdraw)
      .withSender(new Address(ownerAddress))
      .buildTransaction()
      .toPlainObject();
  }

  private async getFirstQueryResult(interaction: Interaction) {
    let queryResponse = await this.mxProxyService.getService().queryContract(interaction.buildQuery());
    let result = this.parser.parseQueryResponse(queryResponse, interaction.getEndpoint());
    return result;
  }
}

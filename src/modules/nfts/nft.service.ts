import { Injectable } from '@nestjs/common';
import { CacheManagerService } from '../../common/services/cache-manager/cache-manager.service';
import '../../utils/extentions';
import { ElrondProxyService } from '../../common/services/elrond-communication/elrond-proxy.service';

import {
  BigUIntValue,
  GasLimit,
  Interaction,
  TokenIdentifierValue,
  U64Value,
  TypedValue,
  Address,
  ContractFunction,
  BytesValue,
} from '@elrondnetwork/erdjs';

import { TransactionOnNetwork } from '@elrondnetwork/erdjs/out/transactionOnNetwork';
import { Asset } from './dto/asset.dto';
import BigNumber from 'bignumber.js';

@Injectable()
export class NftService {
  constructor(
    private cacheManagerService: CacheManagerService,
    private elrondProxyService: ElrondProxyService,
  ) { }

  async getAssetsForUser(): Promise<Asset[] | any> {
    return new Array<Asset>();
  }
  //view
  async isUpForAction(): Promise<boolean> {
    const contract = await this.elrondProxyService.getSmartContract();
    let isUpForAuction = <Interaction>(
      contract.methods
        .isAlreadyUpForAuction([
          new TokenIdentifierValue(Buffer.from('DANA-17fffc')),
          new U64Value(new BigNumber(8)),
        ])
        .withGasLimit(new GasLimit(5000000))
    );
    let response = await contract.runQuery(
      this.elrondProxyService.getService(),
      isUpForAuction.buildQuery(),
    );

    let result = isUpForAuction.interpretQueryResponse(response);
    return result.firstValue.valueOf() as boolean;
  }

  //view
  async getPaymentTokenForAuctionedNft(): Promise<boolean> {
    const contract = await this.elrondProxyService.getSmartContract();
    let getPaymentTokenForAuctionedNft = <Interaction>(
      contract.methods
        .getPaymentTokenForAuctionedNft([
          new TokenIdentifierValue(Buffer.from('DANA-17fffc')),
          new U64Value(new BigNumber(1)),
        ])
        .withGasLimit(new GasLimit(5000000))
    );
    let response = await contract.runQuery(
      this.elrondProxyService.getService(),
      getPaymentTokenForAuctionedNft.buildQuery(),
    );

    let result = getPaymentTokenForAuctionedNft.interpretQueryResponse(
      response,
    );
    return result.firstValue.valueOf() as boolean;
  }

  //view
  async getMinMaxBid(): Promise<boolean> {
    const contract = await this.elrondProxyService.getSmartContract();
    let getMinMaxBid = <Interaction>(
      contract.methods
        .getMinMaxBid([
          new TokenIdentifierValue(Buffer.from('DANA-17fffc')),
          new U64Value(new BigNumber(1)),
        ])
        .withGasLimit(new GasLimit(5000000))
    );
    let response = await contract.runQuery(
      this.elrondProxyService.getService(),
      getMinMaxBid.buildQuery(),
    );

    let result = getMinMaxBid.interpretQueryResponse(response);
    return result.firstValue.valueOf() as boolean;
  }

  //view
  async getDeadline(): Promise<TypedValue> {
    const contract = await this.elrondProxyService.getSmartContract();
    let getDeadline = <Interaction>(
      contract.methods
        .getDeadline([
          new TokenIdentifierValue(Buffer.from('DANA-17fffc')),
          new U64Value(new BigNumber(1)),
        ])
        .withGasLimit(new GasLimit(5000000))
    );
    let response = await contract.runQuery(
      this.elrondProxyService.getService(),
      getDeadline.buildQuery(),
    );

    let result = getDeadline.interpretQueryResponse(response);
    return result.firstValue;
  }

  //view
  async getOriginalOwner(): Promise<TypedValue> {
    const contract = await this.elrondProxyService.getSmartContract();
    let getOriginalOwner = <Interaction>(
      contract.methods
        .getOriginalOwner([
          new TokenIdentifierValue(Buffer.from('DANA-17fffc')),
          new U64Value(new BigNumber(5)),
        ])
        .withGasLimit(new GasLimit(5000000))
    );
    let response = await contract.runQuery(
      this.elrondProxyService.getService(),
      getOriginalOwner.buildQuery(),
    );
    console.log('getOriginalOwner', response);
    let result = getOriginalOwner.interpretQueryResponse(response);
    return result.firstValue;
  }

  //view
  async getCurrentWinningBid(): Promise<TypedValue> {
    const contract = await this.elrondProxyService.getSmartContract();
    let getCurrentWinningBid = <Interaction>(
      contract.methods
        .getCurrentWinningBid([
          new TokenIdentifierValue(Buffer.from('DANA-17fffc')),
          new U64Value(new BigNumber(1)),
        ])
        .withGasLimit(new GasLimit(5000000))
    );
    let response = await contract.runQuery(
      this.elrondProxyService.getService(),
      getCurrentWinningBid.buildQuery(),
    );

    let result = getCurrentWinningBid.interpretQueryResponse(response);
    return result.firstValue;
  }

  //view
  async getCurrentWinner(): Promise<TypedValue> {
    const contract = await this.elrondProxyService.getSmartContract();
    let getCurrentWinner = <Interaction>(
      contract.methods
        .getCurrentWinner([
          new TokenIdentifierValue(Buffer.from('DANA-17fffc')),
          new U64Value(new BigNumber(1)),
        ])
        .withGasLimit(new GasLimit(5000000))
    );
    let response = await contract.runQuery(
      this.elrondProxyService.getService(),
      getCurrentWinner.buildQuery(),
    );

    let result = getCurrentWinner.interpretQueryResponse(response);
    return result.firstValue;
  }

  //view
  async getFullAuctionData(): Promise<TypedValue> {
    const contract = await this.elrondProxyService.getSmartContract();
    let getFullAuctionData = <Interaction>(
      contract.methods
        .getFullAuctionData([
          new TokenIdentifierValue(Buffer.from('DANA-17fffc')),
          new U64Value(new BigNumber(1)),
        ])
        .withGasLimit(new GasLimit(5000000))
    );
    let response = await contract.runQuery(
      this.elrondProxyService.getService(),
      getFullAuctionData.buildQuery(),
    );

    let result = getFullAuctionData.interpretQueryResponse(response);
    return result.firstValue;
  }

  async actionToken(): Promise<TransactionOnNetwork> {
    const contract = await this.elrondProxyService.getSmartContract();
    let auctionToken = <Interaction>contract.methods
      .auctionToken([
        new BigUIntValue(new BigNumber(0.1)),
        new BigUIntValue(new BigNumber(100)),
        new U64Value(new BigNumber(1)),
        new TokenIdentifierValue(Buffer.from('DANA-17fffc')),
        new U64Value(new BigNumber(0)),
        // new TokenIdentifierValue(Buffer.from('DANA-17fffc')),
        // new U64Value(0),
        // new U64Value(1),
        // new Address(
        //   'erd1qqqqqqqqqqqqqpgqw8faqylfxhsx3nvpngkh9sf97gh877ysd8ssererdq',
        // ),
      ])
      .withGasLimit(new GasLimit(5000000));
    let response1 = await contract.call({
      func: new ContractFunction('ESDTNFTTransfer'),
      args: [
        new TokenIdentifierValue(Buffer.from('DANA-17fffc')),
        new U64Value(new BigNumber(0)),
        new U64Value(new BigNumber(1)),
        BytesValue.fromUTF8(
          new Address(
            'erd1qqqqqqqqqqqqqpgqw8faqylfxhsx3nvpngkh9sf97gh877ysd8ssererdq',
          ).hex(),
        ),
        BytesValue.fromUTF8('auctionToken'),
        new BigUIntValue(new BigNumber(0.1)),
        new BigUIntValue(new BigNumber(100)),
        new U64Value(new BigNumber(1)),
        new TokenIdentifierValue(Buffer.from('DANA-17fffc')),
        new U64Value(new BigNumber(0)),
      ],
      gasLimit: new GasLimit(1400000000),
    });

    return response1.toPlainObject();
  }

  async endAuction(): Promise<TransactionOnNetwork> {
    const contract = await this.elrondProxyService.getSmartContract();
    let endAuction = <Interaction>(
      contract.methods
        .endAuction([
          new TokenIdentifierValue(Buffer.from('DANA-17fffc')),
          new U64Value(new BigNumber(1)),
        ])
        .withGasLimit(new GasLimit(5000000))
    );
    let query = endAuction.buildQuery();
    let response = await contract.call({
      func: query.func,
      args: query.args,
      value: query.value,
      gasLimit: new GasLimit(5000000),
    });
    
    return response.toPlainObject();
  }

  async setCutPercentage(): Promise<TypedValue> {
    const contract = await this.elrondProxyService.getSmartContract();
    let setCutPercentage = <Interaction>(
      contract.methods
        .setCutPercentage([new U64Value(new BigNumber(10))])
        .withGasLimit(new GasLimit(5000000))
    );
    let query = setCutPercentage.buildQuery();
    let response = contract.call({
      func: query.func,
      args: query.args,
      value: query.value,
      gasLimit: new GasLimit(5000000),
    });
    return response.toPlainObject();
  }

  async bid(): Promise<TypedValue> {
    const contract = await this.elrondProxyService.getSmartContract();
    let bid = <Interaction>(
      contract.methods
        .bid([
          new TokenIdentifierValue(Buffer.from('DANA-17fffc')),
          new U64Value(new BigNumber(1)),
        ])
        .withGasLimit(new GasLimit(5000000))
    );
    let query = bid.buildQuery();
    let response = contract.call({
      func: query.func,
      args: query.args,
      value: query.value,
      gasLimit: new GasLimit(5000000),
    });
    return response.toPlainObject();
  }
}

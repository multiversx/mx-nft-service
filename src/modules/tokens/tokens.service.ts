import { forwardRef, Inject, Injectable } from '@nestjs/common';
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
import { TokenType } from '../nfts/dto/token.dto';
import { TokenEntity } from 'src/db/token/token.entity';
import { TokensServiceDb } from 'src/db/token/tokens.servicedb';
import { ElrondProxyService } from 'src/common/services/elrond-communication/elrond-proxy.service';

@Injectable()
export class TokensService {
  constructor(
    private tokensServiceDb: TokensServiceDb,
    private proxyService: ElrondProxyService,
  ) {}
  receiverAddress: string =
    'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u';

  async issueNft(
    token_name: string,
    token_ticker: string,
    owner_address: string,
  ): Promise<TransactionNode> {
    const contract = new SmartContract({
      address: new Address(this.receiverAddress),
    });

    await this.tokensServiceDb.updateToken(
      new TokenEntity({
        tokenName: token_name,
        tokenTicker: token_ticker,
        owner: owner_address,
      }),
    );
    const transaction = contract.call({
      func: new ContractFunction('issueNonFungible'),
      value: Balance.egld(5),
      args: [
        BytesValue.fromUTF8(token_name),
        BytesValue.fromUTF8(token_ticker),
      ],
      gasLimit: new GasLimit(60000000),
    });
    const transactionNode = transaction.toPlainObject();
    return transactionNode;
  }

  async getTokensForAddress(owner_address: string): Promise<TokenType[]> {
    let tokenTypes = <TokenType[]>[];
    let tokenTypesWithoutIdentifier = <TokenType[]>[];

    await this.getTokensWithoutId(
      owner_address,
      tokenTypes,
      tokenTypesWithoutIdentifier,
    );

    return await this.setTokensIdentifiers(
      tokenTypesWithoutIdentifier,
      owner_address,
      tokenTypes,
    );
  }

  private async setTokensIdentifiers(
    tokenTypesWithoutIdentifier: TokenType[],
    owner_address: string,
    tokenTypes: TokenType[],
  ): Promise<TokenType[]> {
    return this.getTokensIdentifiers(
      await this.getNetworkTokens(tokenTypesWithoutIdentifier),
      owner_address,
      tokenTypes,
    );
  }

  private async getTokensIdentifiers(
    networkTokens: any,
    owner_address: string,
    tokenTypes: TokenType[],
  ): Promise<TokenType[]> {
    for (const token of networkTokens) {
      let tokenProperties = await this.proxyService.getTokenProperties(
        token.tokenIdentifier,
      );
      if (new Address(owner_address).bech32() === tokenProperties) {
        const index = tokenTypes.findIndex(
          (x) => x.tokenTicker === token.tokenTicker,
        );
        tokenTypes[index].tokenIdentifier = token.tokenIdentifier;
        this.tokensServiceDb.updateToken(new TokenEntity(tokenTypes[index]));
      }
    }
    return tokenTypes;
  }

  private async getNetworkTokens(tokenTypesWithoutIdentifier: TokenType[]) {
    return await this.proxyService.getTokens(
      tokenTypesWithoutIdentifier.map((tkn) => tkn.tokenTicker),
    );
  }

  private async getTokensWithoutId(
    owner_address: string,
    tokenTypes: TokenType[],
    tokenTypesWithoutIdentifier: TokenType[],
  ) {
    let tokens = await this.tokensServiceDb.getTokensForAddress(owner_address);
    tokens.forEach((element) => {
      tokenTypes.push(
        new TokenType({
          id: element.id,
          address: element.owner,
          tokenName: element.tokenName,
          tokenTicker: element.tokenTicker,
          creationDate: element.creationDate,
          tokenIdentifier: element.tokenIdentifier,
        }),
      );
    });
    tokenTypes.forEach((token) => {
      if (token.tokenIdentifier === null) {
        tokenTypesWithoutIdentifier.push(token);
      }
    });
  }

  async setNftRoles(
    token_identifier: string,
    address_transfer: string,
    role: string,
  ): Promise<TransactionNode> {
    const contract = new SmartContract({
      address: new Address(this.receiverAddress),
    });
    console.log(token_identifier, address_transfer, role);
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
    const transactionNode = transaction.toPlainObject();
    return transactionNode;
  }

  async fetchTokenIdentifiers(address: string): Promise<[TokenType]> {
    const contract = new SmartContract({
      address: new Address(this.receiverAddress),
    });
    const transaction = contract.call({
      func: new ContractFunction('issueNonFungible'),
      value: Balance.egld(5),

      gasLimit: new GasLimit(60000000),
    });
    return transaction.toPlainObject();
  }
}

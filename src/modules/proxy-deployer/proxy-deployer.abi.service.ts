import { Injectable } from '@nestjs/common';
import { Address, AddressValue, BytesValue, Interaction, List, ResultsParser, U32Value, VariadicValue } from '@multiversx/sdk-core/out';
import { MarketplaceUtils } from '../auctions/marketplaceUtils';
import { TransactionNode } from '../common/transaction';
import { DeployMinterRequest, UpgradeMinterRequest } from './models/requests/DeployMinterRequest';
import { mxConfig, gas } from 'src/config';
import { MxProxyService } from 'src/common';
import { ContractLoader } from '../auctions/contractLoader';

@Injectable()
export class ProxyDeployerAbiService {
  private readonly parser: ResultsParser;
  private contract = new ContractLoader(MarketplaceUtils.proxyDeployerMintersAbiPath);

  constructor(private mxProxyService: MxProxyService) {
    this.parser = new ResultsParser();
  }

  async deployMinterSc(request: DeployMinterRequest): Promise<TransactionNode> {
    const contract = await this.contract.getContract(process.env.DEPLOYER_ADDRESS);

    return contract.methodsExplicit
      .contractDeploy([
        new AddressValue(Address.fromString(process.env.TEMPLATE_MINTER_ADDRESS)),
        VariadicValue.fromItems(
          BytesValue.fromHex(Address.fromString(request.royaltiesClaimAddress).hex()),
          BytesValue.fromHex(Address.fromString(request.mintClaimAddress).hex()),
          new U32Value(request.maxNftsPerTransaction),
          BytesValue.fromHex(Address.fromString(request.ownerAddress).hex()),
        ),
      ])
      .withChainID(mxConfig.chainID)
      .withGasLimit(gas.deployMinter)
      .withSender(Address.fromString(request.ownerAddress))
      .buildTransaction()
      .toPlainObject();
  }

  async deployBulkSc(ownerAddress: string): Promise<TransactionNode> {
    const contract = await this.contract.getContract(process.env.DEPLOYER_ADDRESS);

    return contract.methodsExplicit
      .contractDeploy([
        new AddressValue(Address.fromString(process.env.TEMPLATE_BULK_ADDRESS)),
        VariadicValue.fromItems(BytesValue.fromHex(Address.fromString(ownerAddress).hex())),
      ])
      .withChainID(mxConfig.chainID)
      .withGasLimit(gas.deployMinter)
      .withSender(Address.fromString(ownerAddress))
      .buildTransaction()
      .toPlainObject();
  }

  async deployMarketplaceSc(ownerAddress: string, marketplaceFee: string, paymentTokens?: string[]): Promise<TransactionNode> {
    const contract = await this.contract.getContract(process.env.DEPLOYER_ADDRESS);
    const args: any[] = [new AddressValue(Address.fromString(process.env.TEMPLATE_MARKETPLACE_ADDRESS))];
    if (paymentTokens) {
      args.push(
        VariadicValue.fromItems(new U32Value(marketplaceFee), List.fromItems(paymentTokens?.map((tag) => BytesValue.fromUTF8(tag)))),
      );
    }
    return contract.methods
      .contractDeploy(args)
      .withChainID(mxConfig.chainID)
      .withGasLimit(gas.deployMinter)
      .withSender(Address.fromString(ownerAddress))
      .buildTransaction()
      .toPlainObject();
  }

  async pauseNftMinter(ownerAddress: string, request: UpgradeMinterRequest): Promise<TransactionNode> {
    const contract = await this.contract.getContract(process.env.DEPLOYER_ADDRESS);

    return contract.methodsExplicit
      .pauseNftMinter([new AddressValue(new Address(request.minterAddress))])
      .withChainID(mxConfig.chainID)
      .withGasLimit(gas.deployMinter)
      .withSender(Address.fromString(ownerAddress))
      .buildTransaction()
      .toPlainObject();
  }

  async resumeNftMinter(ownerAddress: string, request: UpgradeMinterRequest): Promise<TransactionNode> {
    const contract = await this.contract.getContract(process.env.DEPLOYER_ADDRESS);

    return contract.methodsExplicit
      .resumeNftMinter([new AddressValue(new Address(request.minterAddress))])
      .withChainID(mxConfig.chainID)
      .withSender(Address.fromString(ownerAddress))
      .withGasLimit(gas.deployMinter)
      .buildTransaction()
      .toPlainObject();
  }

  public async getMintersForAddress(address: string): Promise<string[]> {
    const contract = await this.contract.getContract(process.env.DEPLOYER_ADDRESS);
    let getDataQuery = <Interaction>contract.methodsExplicit.getUserNftMinterContracts([new AddressValue(new Address(address))]);

    const response = await this.getFirstQueryResult(getDataQuery);
    const contractAddresses: AddressValue[] = response?.firstValue?.valueOf();
    return contractAddresses.map((x) => x.valueOf().bech32());
  }

  private async getFirstQueryResult(interaction: Interaction) {
    let queryResponse = await this.mxProxyService.getService().queryContract(interaction.buildQuery());
    let result = this.parser.parseQueryResponse(queryResponse, interaction.getEndpoint());
    return result;
  }
}

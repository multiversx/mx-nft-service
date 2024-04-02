import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { UseGuards } from '@nestjs/common';
import { JwtOrNativeAuthGuard } from '../auth/jwt.or.native.auth-guard';
import { GqlAdminAuthGuard } from '../auth/gql-admin.auth-guard';
import { DeployMinterRequest } from './models/requests/DeployMinterRequest';
import { ProxyDeployerAbiService } from './proxy-deployer.abi.service';
import { TransactionNode } from '../common/transaction';
import { DeployBulkArgs } from './models/DeployBulkArgs';
import { DeployMarketplaceArgs } from './models/DeployMarketplaceArgs';
import { DeployMinterArgs } from './models/DeployMinterArgs';
import { WhitelistMinterArgs } from '../minters/models';
import { WhitelistMinterRequest } from '../minters/models/requests/whitelistMinterRequest';
import { MintersService } from '../minters/minters.service';

@Resolver(() => TransactionNode)
export class ProxyDeployerMutationsResolver extends BaseResolver(TransactionNode) {
  constructor(private minterService: MintersService, private minterDeployerService: ProxyDeployerAbiService) {
    super();
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async deployMinterSmartContract(@Args('input') input: DeployMinterArgs): Promise<TransactionNode> {
    return await this.minterDeployerService.deployMinterSc(DeployMinterRequest.fromArgs(input));
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async whitelistMinterSmartContract(@Args('input') input: WhitelistMinterArgs): Promise<Boolean> {
    const contractAddresses = await this.minterDeployerService.getDeployedContractsForAddressAndTemplate(
      input.adminAddress,
      process.env.TEMPLATE_MINTER_ADDRESS,
    );
    if (contractAddresses.includes(input.address)) {
      return await this.minterService.whitelistMinter(WhitelistMinterRequest.fromArgs(input));
    }
    return false;
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async deployBulkSmartContract(@Args('input') input: DeployBulkArgs): Promise<TransactionNode> {
    return await this.minterDeployerService.deployBulkSc(input.ownerAddress);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async deployMarketplaceContract(@Args('input') input: DeployMarketplaceArgs): Promise<TransactionNode> {
    return await this.minterDeployerService.deployMarketplaceSc(input.ownerAddress, input.marketplaceFee, input.paymentTokens);
  }
}

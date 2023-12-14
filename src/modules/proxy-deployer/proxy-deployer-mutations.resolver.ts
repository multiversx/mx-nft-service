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

@Resolver(() => TransactionNode)
export class ProxyDeployerMutationsResolver extends BaseResolver(TransactionNode) {
  constructor(private minterDeployerService: ProxyDeployerAbiService) {
    super();
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async deployMinterSmartContract(@Args('input') input: DeployMinterArgs): Promise<TransactionNode> {
    return await this.minterDeployerService.deployMinterSc(DeployMinterRequest.fromArgs(input));
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async deployBulkSmartContract(@Args('input') input: DeployBulkArgs): Promise<TransactionNode> {
    return await this.minterDeployerService.deployBulkSc(input.ownerAddress);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async deployMarketplaceContract(@Args('input') input: DeployMarketplaceArgs): Promise<TransactionNode> {
    return await this.minterDeployerService.deployBulkSc(input.ownerAddress);
  }
}

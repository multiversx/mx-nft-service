import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { UseGuards } from '@nestjs/common';
import { JwtOrNativeAuthGuard } from '../auth/jwt.or.native.auth-guard';
import { GqlAdminAuthGuard } from '../auth/gql-admin.auth-guard';
import { DeployMinterArgsP, UpgradeMinterArgs } from './models/DeployMinterArgs';
import { DeployMinterRequest, UpgradeMinterRequest } from './models/requests/DeployMinterRequest';
import { ProxyDeployerAbiService } from './proxy-deployer.abi.service';
import { TransactionNode } from '../common/transaction';
import { AuthUser } from '../auth/authUser';
import { UserAuthResult } from '../auth/userAuthResult';
import { MintersResponse } from './models/MintersResponse';

@Resolver(() => MintersResponse)
export class ProxyDeployerMutationsResolver extends BaseResolver(MintersResponse) {
  constructor(private minterDeployerService: ProxyDeployerAbiService) {
    super();
  }

  @Mutation(() => TransactionNode)
  // @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async deployMinterP(@Args('input') input: DeployMinterArgsP): Promise<TransactionNode> {
    return await this.minterDeployerService.deployMinter(DeployMinterRequest.fromArgs(input));
  }

  // @Mutation(() => TransactionNode)
  // @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  // async pauseMinter(@Args('input') input: UpgradeMinterArgs, @AuthUser() user: UserAuthResult): Promise<TransactionNode> {
  //   return await this.minterDeployerService.pauseNftMinter(user.address, UpgradeMinterRequest.fromArgs(input));
  // }

  // @Mutation(() => TransactionNode)
  // @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  // async resumeMinter(@Args('input') input: UpgradeMinterArgs, @AuthUser() user: UserAuthResult): Promise<TransactionNode> {
  //   return await this.minterDeployerService.resumeNftMinter(user.address, UpgradeMinterRequest.fromArgs(input));
  // }
}

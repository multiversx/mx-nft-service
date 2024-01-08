import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { WhitelistMinterArgs, Minter } from './models';
import { UseGuards } from '@nestjs/common';
import { JwtOrNativeAuthGuard } from '../auth/jwt.or.native.auth-guard';
import { MintersService } from './minters.service';
import { GqlAdminAuthGuard } from '../auth/gql-admin.auth-guard';
import { WhitelistMinterRequest } from './models/requests/whitelistMinterRequest';
import { DeployMinterArgs, UpgradeMinterArgs } from '../proxy-deployer/models/DeployMinterArgs';
import { DeployMinterRequest, UpgradeMinterRequest } from './models/requests/DeployMinterRequest';
import { MintersDeployerAbiService } from './minters-deployer.abi.service';
import { TransactionNode } from '../common/transaction';
import { AuthUser } from '../auth/authUser';
import { UserAuthResult } from '../auth/userAuthResult';
import { MintersResponse } from './models/MintersResponse';

@Resolver(() => MintersResponse)
export class MintersMutationsResolver extends BaseResolver(MintersResponse) {
  constructor(private minterService: MintersService, private minterDeployerService: MintersDeployerAbiService) {
    super();
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async whitelistMinter(@Args('input') input: WhitelistMinterArgs): Promise<Boolean> {
    const contractAddresses = await this.minterDeployerService.getMintersForAddress(input.adminAddress);
    if (contractAddresses.includes(input.address)) {
      return await this.minterService.whitelistMinter(WhitelistMinterRequest.fromArgs(input));
    }
    return false;
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async deployMinter(@Args('input') input: DeployMinterArgs): Promise<TransactionNode> {
    return await this.minterDeployerService.deployMinter(DeployMinterRequest.fromArgs(input));
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async pauseMinter(@Args('input') input: UpgradeMinterArgs, @AuthUser() user: UserAuthResult): Promise<TransactionNode> {
    return await this.minterDeployerService.pauseNftMinter(user.address, UpgradeMinterRequest.fromArgs(input));
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async resumeMinter(@Args('input') input: UpgradeMinterArgs, @AuthUser() user: UserAuthResult): Promise<TransactionNode> {
    return await this.minterDeployerService.resumeNftMinter(user.address, UpgradeMinterRequest.fromArgs(input));
  }
}

import { Query, Resolver, ResolveField } from '@nestjs/graphql';
import { elrondConfig } from 'src/config';
import { NftMarketplaceAbiService } from '../auctions';
import { ContractInfo } from './models/Contract-Info.dto';

@Resolver(() => ContractInfo)
export class ContractInfoResolver {
  constructor(private nftAbiService: NftMarketplaceAbiService) {}

  @Query(() => ContractInfo)
  async contractInfo(): Promise<ContractInfo> {
    return new ContractInfo({ address: elrondConfig.nftMarketplaceAddress });
  }

  @ResolveField(() => String)
  async marketplaceCutPercentage() {
    return await this.nftAbiService.getCutPercentage();
  }

  @ResolveField(() => Boolean)
  async isPaused() {
    return await this.nftAbiService.getIsPaused();
  }
}

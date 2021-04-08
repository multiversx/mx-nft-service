import { TypedValue } from '@elrondnetwork/erdjs/out';
import { TransactionOnNetwork } from '@elrondnetwork/erdjs/out/transactionOnNetwork';
import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Asset } from './dto/asset.dto';
import { NftService } from './nft.service';

@Controller('nfts')
@ApiTags('nfts')
export class NftController {
  constructor(private nftService: NftService) {}

  @Get('is-up-for-auction')
  @ApiOkResponse({
    description:
      'All the query data for the specified address and for all active contracts',
    type: [Asset],
  })
  // @UseInterceptors(CacheInterceptor)
  // @CacheTTL(12)
  isUpForAction(): Promise<boolean> {
    return this.nftService.isUpForAction();
  }

  @Get('startAuction')
  @ApiOkResponse({
    description:
      'All the query data for the specified address and for all active contracts',
    type: [Asset],
  })
  // @UseInterceptors(CacheInterceptor)
  // @CacheTTL(12)
  startAuction(): Promise<TransactionOnNetwork> {
    return this.nftService.actionToken();
  }

  @Get('getOriginalOwner')
  @ApiOkResponse({
    description:
      'All the query data for the specified address and for all active contracts',
    type: [Asset],
  })
  // @UseInterceptors(CacheInterceptor)
  // @CacheTTL(12)
  getOriginalOwner(): Promise<TypedValue> {
    return this.nftService.getOriginalOwner();
  }

  @Get('getDeadline')
  @ApiOkResponse({
    description:
      'All the query data for the specified address and for all active contracts',
    type: [Asset],
  })
  // @UseInterceptors(CacheInterceptor)
  // @CacheTTL(12)
  getDeadline(): Promise<TypedValue> {
    return this.nftService.getDeadline();
  }
}

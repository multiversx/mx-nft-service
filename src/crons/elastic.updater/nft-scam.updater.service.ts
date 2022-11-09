import { Injectable, Logger } from '@nestjs/common';
import { Locker } from 'src/utils/locker';
import { NftScamService } from 'src/modules/nft-scam/nft-scam.service';

@Injectable()
export class NftScamUpdaterService {
  constructor(
    private readonly nftScamService: NftScamService,
    private readonly logger: Logger,
  ) {}

  async handleUpdateScamInfoWhereNotSetOrOutdated(): Promise<void> {
    try {
      await Locker.lock(
        `handleUpdateScamInfoWhereNotSetOrOutdated`,
        async () => {
          await this.nftScamService.validateOrUpdateAllNftsScamInfo();
        },
        true,
      );
    } catch (error) {
      this.logger.error(
        `Error when setting/updating scam info where not set / outdated`,
        {
          path: `${NftScamUpdaterService.name}.${this.handleUpdateScamInfoWhereNotSetOrOutdated.name}`,
          exception: error?.message,
        },
      );
    }
  }
}

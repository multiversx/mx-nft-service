import { Injectable, Logger } from '@nestjs/common';
import { Minter } from './models';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { MinterEntity } from 'src/db/minters';
import { UnableToLoadError } from 'src/common/models/errors/unable-to-load-error';
import { MintersCachingService } from './minters-caching.service';
import { WhitelistMinterRequest } from './models/requests/whitelistMinterRequest';

@Injectable()
export class MintersService {
  constructor(
    private persistenceService: PersistenceService,
    private cacheService: MintersCachingService,
    private readonly logger: Logger,
  ) {}

  async whitelistMinter(request: WhitelistMinterRequest): Promise<Minter> {
    try {
      const savedMinter = await this.persistenceService.saveMinter(
        MinterEntity.fromRequest(request),
      );
      this.cacheService.invalidateMinters();
      return Minter.fromEntity(savedMinter);
    } catch (error) {
      this.logger.error('An error has occured while saving the minter ', {
        path: this.whitelistMinter.name,
        minterAddress: request?.address,
        exception: error,
      });
      throw new UnableToLoadError(
        `An error has ocurred while saving the minter: ${request?.address}`,
      );
    }
  }

  async getMinters(): Promise<Minter[]> {
    try {
      const minters = await this.cacheService.getMinters(() =>
        this.persistenceService.getMinters(),
      );
      return minters?.items?.map((minter) => Minter.fromEntity(minter));
    } catch (error) {
      this.logger.error('An error has occured while getting minters', {
        path: this.getMinters.name,
        exception: error,
      });
      return [];
    }
  }

  async getMintersAddresses(): Promise<string[]> {
    try {
      const minters = await this.getMinters();
      return minters.map((x) => x.address);
    } catch (error) {
      this.logger.error(
        'An error has occured while getting minters addresses',
        {
          path: this.getMintersAddresses.name,
          exception: error,
        },
      );
      return [];
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { Minter } from './models';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { MinterEntity } from 'src/db/minters';
import { UnableToLoadError } from 'src/common/models/errors/unable-to-load-error';
import { MintersCachingService } from './minters-caching.service';
import { WhitelistMinterRequest } from './models/requests/whitelistMinterRequest';
import { MinterFilters } from './models/MinterFilters';
import { MintersDeployerAbiService } from './minters-deployer.abi.service';

@Injectable()
export class MintersService {
  constructor(
    private persistenceService: PersistenceService,
    private cacheService: MintersCachingService,
    private minterDeployerService: MintersDeployerAbiService,
    private readonly logger: Logger,
  ) {}

  async whitelistMinter(request: WhitelistMinterRequest): Promise<boolean> {
    try {
      const contractAddresses = await this.minterDeployerService.getMintersForAddress(request.adminAddress);
      if (contractAddresses.includes(request.address)) {
        const savedMinter = await this.persistenceService.saveMinter(MinterEntity.fromRequest(request));
        this.cacheService.invalidateMinters();
        return savedMinter ? true : false;
      }
      return false;
    } catch (error) {
      this.logger.error('An error has occured while saving the minter ', {
        path: this.whitelistMinter.name,
        minterAddress: request?.address,
        exception: error,
      });
      throw new UnableToLoadError(`An error has ocurred while saving the minter: ${request?.address}`);
    }
  }

  async getMinters(filters?: MinterFilters): Promise<Minter[]> {
    try {
      let minters = await this.cacheService.getMinters(() => this.persistenceService.getMinters());
      if (filters) {
        if (filters.minterAddress) minters = minters.filter((m) => m.address === filters.minterAddress);
        if (filters.minterAdminAddress) minters = minters.filter((m) => m.adminAddress === filters.minterAdminAddress);
      }

      return minters?.map((minter) => Minter.fromEntity(minter));
    } catch (error) {
      this.logger.error('An error has occured while getting minters', {
        path: this.getMinters.name,
        exception: error,
        filters,
      });
      return [];
    }
  }

  async getMintersAddresses(): Promise<string[]> {
    try {
      const minters = await this.getMinters();
      return minters?.map((x) => x.address);
    } catch (error) {
      this.logger.error('An error has occured while getting minters addresses', {
        path: this.getMintersAddresses.name,
        exception: error,
      });
      return [];
    }
  }
}

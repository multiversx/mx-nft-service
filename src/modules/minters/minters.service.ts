import { Injectable, Logger } from '@nestjs/common';
import { Minter } from './models';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { MinterEntity } from 'src/db/minters';
import { UnableToLoadError } from 'src/common/models/errors/unable-to-load-error';

@Injectable()
export class MintersService {
  constructor(
    private persistenceService: PersistenceService,
    private readonly logger: Logger,
  ) {}

  async whitelistMinter(
    minterAddress: string,
    name: string,
    description: string,
  ): Promise<Minter> {
    try {
      const savedMinter = await this.persistenceService.saveMinter(
        new MinterEntity({ address: minterAddress, name, description }),
      );
      return Minter.fromEntity(savedMinter);
    } catch (error) {
      this.logger.error('An error has occured while saving the minter ', {
        path: this.whitelistMinter.name,
        minterAddress,
        exception: error,
      });
      throw new UnableToLoadError(
        `An error has ocurred while saving the minter: ${minterAddress}`,
      );
    }
  }
}

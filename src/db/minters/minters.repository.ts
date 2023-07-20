import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MYSQL_ALREADY_EXISTS } from 'src/utils/constants';
import { Repository } from 'typeorm';
import { MinterEntity } from './minter.entity';

@Injectable()
export class MintersRepository {
  constructor(
    @InjectRepository(MinterEntity)
    private mintersRepository: Repository<MinterEntity>,
  ) {}

  async getMinters(): Promise<MinterEntity[]> {
    return await this.mintersRepository.createQueryBuilder('minters').getMany();
  }

  async saveMinter(minter: MinterEntity): Promise<MinterEntity> {
    try {
      return await this.mintersRepository.save(minter);
    } catch (err) {
      // If like already exists, we ignore the error.
      if (err.errno === MYSQL_ALREADY_EXISTS) {
        return null;
      }
      throw err;
    }
  }
}

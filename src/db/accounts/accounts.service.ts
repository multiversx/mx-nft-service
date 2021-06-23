import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import FilterQueryBuilder from 'src/modules/FilterQueryBuilder';
import { FiltersExpression } from 'src/modules/filtersTypes';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { SocialLinkEntity } from '../socialLinks/social-link.entity';
import { AccountEntity } from './account.entity';

@Injectable()
export class AccountsServiceDb {
  constructor(
    @InjectRepository(AccountEntity)
    private accountRepository: Repository<AccountEntity>,
  ) {}

  async getAccountByAddress(address: string): Promise<AccountEntity> {
    return await this.accountRepository.findOne({
      where: [{ address: address }],
    });
  }

  async getAccounts(
    limit: number = 50,
    offset: number,
    filters: FiltersExpression,
  ): Promise<[AccountEntity[], number]> {
    const filterQueryBuilder = new FilterQueryBuilder<AccountEntity>(
      this.accountRepository,
      filters,
    );
    const queryBuilder: SelectQueryBuilder<AccountEntity> =
      filterQueryBuilder.build();
    queryBuilder.offset(offset);
    queryBuilder.limit(limit);

    return await queryBuilder.getManyAndCount();
  }

  async getSocialLinks(accountId: number): Promise<SocialLinkEntity[]> {
    const account = await this.accountRepository
      .createQueryBuilder('account')
      .leftJoinAndSelect('account.socialLinks', 'socialLink')
      .where('account.id = :id', { id: accountId })
      .getMany();
    return account.map((x) => x.socialLinks)[0];
  }

  async saveAccount(account: AccountEntity) {
    return await this.accountRepository.save(account);
  }
}

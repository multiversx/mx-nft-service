import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountEntity } from './account.entity';

@Injectable()
export class AccountsServiceDb {
  constructor(
    @InjectRepository(AccountEntity) private accountRepository: Repository<AccountEntity>
  ) { }

  async insertAccount(account: AccountEntity): Promise<AccountEntity> {
    return await this.accountRepository.save(account)
  }

  async getAccountById(id: number): Promise<AccountEntity> {
    return await this.accountRepository.findOne({
      where: [{ id: id }]
    })
  }

  async getAccountByAddress(address: string): Promise<AccountEntity> {
    return await this.accountRepository.findOne({
      where: [{ address: address }]
    })
  }

  async updateAccount(account: AccountEntity) {
    await this.accountRepository.update(account.id, account)
  }
}

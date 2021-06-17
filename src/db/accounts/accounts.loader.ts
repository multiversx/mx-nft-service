import DataLoader = require('dataloader');
import { getRepository } from 'typeorm';
import { AccountEntity } from './account.entity';

const batchAccounts = async (addresses: string[]) => {
  const accounts = await getRepository(AccountEntity)
    .createQueryBuilder('accounts')
    .where('address IN(:...addresses)', {
      addresses: addresses,
    })
    .getMany();
  const accountIdentifiers: { [key: string]: AccountEntity[] } = {};

  accounts.forEach((account) => {
    if (!accountIdentifiers[account.address]) {
      accountIdentifiers[account.address] = [account];
    } else {
      accountIdentifiers[account.address].push(account);
    }
  });

  return addresses.map((auctionId) => accountIdentifiers[auctionId]);
};
const accountsLoader = () => new DataLoader(batchAccounts);

export { accountsLoader as accountsLoader };

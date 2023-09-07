import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { removeCredentialsFromUrl } from 'src/utils/helpers';
import { ApiService } from './api.service';
import { Privacy } from './models';
import { AccountIdentity } from './models/account.identity';

@Injectable()
export class MxIdentityService {
  constructor(private readonly logger: Logger, private readonly apiService: ApiService) {}

  async getProfiles(addresses: string[]): Promise<AccountIdentity[]> {
    const url = `${process.env.ELROND_IDENTITY}api/v1/users/multiple`;

    const uniqueAddresses = [...new Set(addresses)];
    let request: any = { addresses: uniqueAddresses };

    try {
      let response = await this.apiService.post(url, request);

      const accounts = response.data.info;
      return Object.keys(accounts).map(function (key, index) {
        accounts[key] = { ...accounts[key], address: key };
        return accounts[key];
      });
    } catch (error) {
      this.logger.error(`An error occurred while calling the mx identity service on url ${removeCredentialsFromUrl(url)}`, {
        path: this.getProfiles.name,
        addresses: addresses,
        exception: error,
      });
      return;
    }
  }

  async getProfile(address: string): Promise<AccountIdentity> {
    const url = `${process.env.ELROND_IDENTITY}api/v1/users/${address}`;

    try {
      let response = await this.apiService.get(url);
      return {
        ...response.data,
        address: address,
      };
    } catch (error) {
      if (error.status === HttpStatus.FORBIDDEN) {
        return new AccountIdentity({
          address: address,
          privacy: Privacy.private,
        });
      }
      this.logger.error(`An error occurred while calling the mx identity service on url ${removeCredentialsFromUrl(url)}`, {
        path: this.getProfile.name,
        address: address,
        exception: error,
      });
      return;
    }
  }

  async getFollowersCount(address: string): Promise<{ address: string; count: number }> {
    const url = `${process.env.ELROND_IDENTITY}api/v1/followers/${address}/count`;

    try {
      let response = await this.apiService.get(url);
      return response?.data;
    } catch (error) {
      this.logger.error(`An error occurred while calling the mx identity service on url ${removeCredentialsFromUrl(url)}`, {
        path: this.getFollowersCount.name,
        address: address,
        exception: error,
      });
      return { address, count: 0 };
    }
  }

  async getAcountsByHerotag(searchTerm: string): Promise<any> {
    const url = `${process.env.ELROND_IDENTITY}api/v1/herotags/search?criteria=${searchTerm}`;

    try {
      let response = await this.apiService.get(url);

      return response?.data;
    } catch (error) {
      if (error.status === HttpStatus.FORBIDDEN) {
        return new AccountIdentity({
          address: searchTerm,
          privacy: Privacy.private,
        });
      }
      this.logger.error(`An error occurred while calling the mx identity service on url ${removeCredentialsFromUrl(url)}`, {
        path: this.getAcountsByHerotag.name,
        address: searchTerm,
        exception: error,
      });
      return;
    }
  }

  async getAddressByHerotag(herotag: string): Promise<any> {
    const url = `${process.env.ELROND_IDENTITY}api/v1/herotags/${herotag}/address`;

    try {
      let response = await this.apiService.get(url);

      return {
        ...response.data,
        herotag: herotag,
      };
    } catch (error) {
      if (error.status === HttpStatus.FORBIDDEN) {
        return new AccountIdentity({
          herotag: herotag,
          privacy: Privacy.private,
        });
      }
      this.logger.error(`An error occurred while calling the mx identity service on url ${removeCredentialsFromUrl(url)}`, {
        path: this.getAddressByHerotag.name,
        herotag: herotag,
        exception: error,
      });
      return;
    }
  }

  async getAccountsForAddresses(keys: string[]): Promise<any[]> {
    const uniqueAddresses = [...new Set(keys)];
    const accountsPromises = uniqueAddresses.map((address) => this.getProfile(address));

    const accountResponse = await Promise.all(accountsPromises);
    return accountResponse;
  }
}

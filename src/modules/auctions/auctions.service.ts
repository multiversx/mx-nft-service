import { Injectable } from '@nestjs/common';
import '../../utils/extentions';
import { ElrondProxyService } from '../../common/services/elrond-communication/elrond-proxy.service';
import { Address } from '@elrondnetwork/erdjs/out';

@Injectable()
export class AuctionsService {
  constructor(private elrondProxyService: ElrondProxyService) {}

  async getAuctions(address?: string): Promise<Account | any> {
    var account = this.elrondProxyService
      .getService()
      .getAccount(new Address(address));
    return account;
  }

  async getAuction(address: string): Promise<Account | any> {
    var account = this.elrondProxyService
      .getService()
      .getAccount(new Address(address));
    return account;
  }
}

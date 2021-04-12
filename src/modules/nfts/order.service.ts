import { Injectable } from '@nestjs/common';
import '../../utils/extentions';
import { ElrondProxyService } from '../../common/services/elrond-communication/elrond-proxy.service';
import { Asset } from './dto/asset.dto';
import { Address } from '@elrondnetwork/erdjs/out';

@Injectable()
export class OrdersService {
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

  async getNftsForUser(address: string): Promise<Asset[] | any> {
    return {};
  }
}

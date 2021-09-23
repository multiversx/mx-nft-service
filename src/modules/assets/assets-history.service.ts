import { Injectable } from '@nestjs/common';
import { ElrondElasticService } from 'src/common/services/elrond-communication/elrond-elastic.service';
import denominate, { nominateVal } from '../formatters';
import { AssetHistoryLog } from './models/asset-history';
import { AssetActionEnum } from './models/AssetAction.enum';
import { AuctionEventEnum, NftEventEnum } from './models/AuctionEvent.enum';
import { Price } from './models';
import { usdValue } from '../transactionsProcessor/helpers';
import { DataServiceUSD } from '../data.service.usd';

@Injectable()
export class AssetsHistoryService {
  constructor(
    private elasticService: ElrondElasticService,
    private dataService: DataServiceUSD,
  ) {}

  async getHistoryLog(
    collection: string,
    nonce: string,
  ): Promise<AssetHistoryLog[]> {
    const res = await this.elasticService.getNftHistory(
      Buffer.from(collection).toString('base64'),
      Buffer.from(nominateVal(parseInt(nonce)).toString(), 'hex').toString(
        'base64',
      ),
    );

    let historyLog: AssetHistoryLog[] = [];
    for (let index = 0; index < res.length; index++) {
      index = await this.mapLogs(res, index, historyLog);
    }

    return historyLog;
  }

  private async mapLogs(
    res: any,
    index: number,
    historyLog: AssetHistoryLog[],
  ) {
    switch (res[index]._source.events[0].identifier) {
      case AuctionEventEnum.AuctionTokenEvent: {
        historyLog.push(
          this.addHistoryLog(
            res,
            index,
            AssetActionEnum.StartedAuction,
            res[index]._source.address,
            res[index]._source.events[0].topics[3],
          ),
        );
        break;
      }
      case NftEventEnum.ESDTNFTAddQuantity: {
        historyLog.push(
          this.addHistoryLog(
            res,
            index,
            AssetActionEnum.Added,
            res[index]._source.address,
            res[index]._source.events[0].topics[2],
          ),
        );
        break;
      }
      case NftEventEnum.ESDTNFTTransfer: {
        if (res[index]._source.events.length < 2) {
          if (
            !Object.values(AuctionEventEnum).includes(
              res[index + 1]._source.events[1]?.identifier,
            ) &&
            res[index]._source.address === res[index]._source.events[0].address
          ) {
            historyLog.push(
              this.addHistoryLog(
                res,
                index,
                AssetActionEnum.Received,
                res[index]._source.events[0].topics[3].base64ToBech32(),
                res[index]._source.events[0].topics[2],
              ),
            );
          }
        } else {
          index = await this.mapAuctionEvents(res, index, historyLog);
        }
        break;
      }
      case NftEventEnum.ESDTNFTCreate: {
        historyLog.push(
          this.addHistoryLog(
            res,
            index,
            AssetActionEnum.Created,
            res[index]._source.address,
            res[index]._source.events[0].topics[2],
          ),
        );
        break;
      }
    }
    return index;
  }

  private async mapAuctionEvents(
    res: any,
    index: number,
    historyLog: AssetHistoryLog[],
  ) {
    switch (res[index]._source.events[1].identifier) {
      case AuctionEventEnum.WithdrawEvent: {
        historyLog.push(
          this.addHistoryLog(
            res,
            index,
            AssetActionEnum.ClosedAuction,
            res[index]._source.events[1].topics[4]?.base64ToBech32() || '',
            res[index]._source.events[1].topics[3],
          ),
        );
        break;
      }
      case AuctionEventEnum.EndAuctionEvent: {
        const [, , , itemsCount, address, price] =
          res[index]._source.events[1].topics;
        historyLog.push(
          this.addHistoryLog(
            res,
            index,
            AssetActionEnum.Bought,
            address.base64ToBech32(),
            res[index]._source.events[0].topics[2],
            price,
            await this.dataService.getPriceForTimestamp(
              res[index]._source.timestamp,
            ),
          ),
        );
        historyLog.push(
          this.addHistoryLog(
            res,
            index,
            AssetActionEnum.EndedAuction,
            address.base64ToBech32(),
            itemsCount,
            price,
            await this.dataService.getPriceForTimestamp(
              res[index]._source.timestamp,
            ),
          ),
        );

        break;
      }
      case AuctionEventEnum.BuySftEvent: {
        const count = Buffer.from(
          nominateVal(parseInt('1')).toString(),
          'hex',
        ).toString('base64');
        historyLog.push(
          this.addHistoryLog(
            res,
            index,
            AssetActionEnum.Bought,
            res[index]._source.events[1].topics[3].base64ToBech32(),
            count,
            res[index]._source.events[1].topics[4],
            await this.dataService.getPriceForTimestamp(
              res[index]._source.timestamp,
            ),
          ),
        );
        break;
      }
    }
    return index;
  }

  private addHistoryLog(
    res: any,
    index: number,
    action: AssetActionEnum,
    address,
    itemsCount = undefined,
    price = undefined,
    usdAmount = undefined,
  ): AssetHistoryLog {
    return new AssetHistoryLog({
      action: action,
      address: address,
      actionDate: res[index]._source.timestamp || '',
      itemCount: itemsCount
        ? Buffer.from(itemsCount, 'base64').toString('hex')
        : undefined,
      price: price
        ? new Price({
            nonce: 0,
            token: 'EGLD',
            amount: Buffer.from(price || '', 'base64')
              .toString('hex')
              .hexBigNumberToString(),
            usdAmount: usdValue(
              denominate({
                input: Buffer.from(price || '', 'base64')
                  .toString('hex')
                  .hexBigNumberToString(),
                denomination: 18,
                decimals: 18,
                showLastNonZeroDecimal: true,
              }),
              usdAmount || 0,
            ),
          })
        : undefined,
    });
  }
}

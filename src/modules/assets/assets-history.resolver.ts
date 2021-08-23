import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { BaseResolver } from '../base.resolver';
import { AssetHistoryLog } from './models/asset-history';
import { ElrondElasticService } from 'src/common/services/elrond-communication/elrond-elastic.service';
import { AssetActionEnum } from './models/AssetAction.enum';
import { nominateVal } from '../formatters';
import { AuctionEventEnum } from './models/AuctionEvent.enum';
import { Price } from './models';

@Resolver(() => AssetHistoryLog)
export class AssetsHistoryResolver extends BaseResolver(AssetHistoryLog) {
  constructor(private elasticService: ElrondElasticService) {
    super();
  }

  @Query(() => [AssetHistoryLog])
  async assetHistory(
    @Args({ name: 'collection', type: () => String })
    collection,
    @Args({ name: 'nonce', type: () => Int }) nonce,
  ): Promise<AssetHistoryLog[]> {
    const res = await this.elasticService.getNftHistory(
      Buffer.from(collection).toString('base64'),
      Buffer.from(nominateVal(parseInt(nonce)).toString(), 'hex').toString(
        'base64',
      ),
    );

    let historyLog: AssetHistoryLog[] = [];
    for (let index = 0; index < res.length; index++) {
      index = this.mapLogs(res, index, historyLog);
    }

    return historyLog;
  }

  private mapLogs(res: any, index: number, historyLog: AssetHistoryLog[]) {
    switch (res[index]._source.events[0].identifier) {
      case 'auction_token_event': {
        historyLog.push(
          this.addHistoryLog(res, index, AssetActionEnum.StartedAuction),
        );
        break;
      }
      case 'ESDTNFTTransfer': {
        if (res[index]._source.events.length < 2) {
          if (
            !Object.values(AuctionEventEnum).includes(
              res[index + 1]._source.events[1]?.identifier,
            )
          ) {
            historyLog.push(
              new AssetHistoryLog({
                action: AssetActionEnum.Received,
                address: res[index]._source.address,
                actionDate: res[index]._source.timestamp || '',
                itemCount: parseInt(
                  Buffer.from(
                    res[index]._source.events[0].topics[2],
                    'base64',
                  ).toString('hex'),
                ),
              }),
            );
          }
        } else {
          index = this.mapAuctionEvents(res, index, historyLog);
        }
        break;
      }
      case 'ESDTNFTCreate': {
        historyLog.push(
          new AssetHistoryLog({
            action: AssetActionEnum.Created,
            address: res[index]._source.address,
            actionDate: res[index]._source.timestamp || '',
            itemCount: parseInt(
              Buffer.from(
                res[index]._source.events[0].topics[2],
                'base64',
              ).toString('hex'),
            ),
          }),
        );
        break;
      }
    }
    return index;
  }

  private mapAuctionEvents(
    res: any,
    index: number,
    historyLog: AssetHistoryLog[],
  ) {
    switch (res[index]._source.events[1].identifier) {
      case AuctionEventEnum.WithdrawEvent: {
        historyLog.push(
          this.addHistoryLog(res, index, AssetActionEnum.ClosedAuction),
        );
        break;
      }
      case AuctionEventEnum.EndAuctionEvent: {
        historyLog.push(
          new AssetHistoryLog({
            action: AssetActionEnum.Bought,
            address: res[index]._source.events[1].topics[4].base64ToBech32(),
            actionDate: res[index]._source.timestamp || '',
            itemCount: parseInt(
              Buffer.from(
                res[index]._source.events[0].topics[2],
                'base64',
              ).toString('hex'),
            ),
            price: new Price({
              amount: Buffer.from(
                res[index]._source.events[1].topics[5] || '',
                'base64',
              )
                .toString('hex')
                .hexBigNumberToString(),
            }),
          }),
        );
        historyLog.push(
          new AssetHistoryLog({
            action: AssetActionEnum.EndedAuction,
            address: res[index]._source.address,
            actionDate: res[index]._source.timestamp || '',
            itemCount: parseInt(
              Buffer.from(
                res[index]._source.events[1].topics[3],
                'base64',
              ).toString('hex'),
            ),
            price: new Price({
              amount: Buffer.from(
                res[index]._source.events[1].topics[5] || '',
                'base64',
              )
                .toString('hex')
                .hexBigNumberToString(),
            }),
          }),
        );

        break;
      }
      case AuctionEventEnum.BuySftEvent: {
        historyLog.push(
          new AssetHistoryLog({
            action: AssetActionEnum.Bought,
            address: res[index]._source.address,
            actionDate: res[index]._source.timestamp || '',
            itemCount: 1,
            price: new Price({
              amount: Buffer.from(
                res[index]._source.events[1].topics[5] || '',
                'base64',
              )
                .toString('hex')
                .hexBigNumberToString(),
            }),
          }),
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
  ): AssetHistoryLog {
    return new AssetHistoryLog({
      action: action,
      address: res[index]._source.address,
      actionDate: res[index]._source.timestamp || '',
      itemCount: parseInt(
        Buffer.from(res[index]._source.events[0].topics[3], 'base64').toString(
          'hex',
        ),
      ),
    });
  }
}

import { TimeConstants } from 'src/utils/time-utils';

export class CacheInfo {
  key: string = '';
  ttl: number = TimeConstants.oneSecond * 6;

  static AllCollections: CacheInfo = {
    key: 'allCollections',
    ttl: TimeConstants.oneHour,
  };
}

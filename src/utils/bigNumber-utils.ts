import BigNumber from 'bignumber.js';

export class BigNumberUtils {
  static denominateAmount(value: string, decimals: number): number {
    return new BigNumber(value || '0')
      .dividedBy(Math.pow(10, decimals))
      .toNumber();
  }
}

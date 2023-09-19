import * as crypto from 'crypto-js';
export class CustomRank {
  identifier: string;
  rank: number;

  constructor(init?: Partial<CustomRank>) {
    Object.assign(this, init);
  }

  static generateHash(customRanks: CustomRank[]): string {
    return crypto.SHA256(JSON.stringify(customRanks)).toString();
  }

  static areIdenticalHashes(customRanks: CustomRank[], hash: string): boolean {
    if (hash === this.generateHash(customRanks)) {
      return true;
    }

    return false;
  }
}

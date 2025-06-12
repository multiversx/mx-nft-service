import BigNumber from 'bignumber.js';

declare global {
  interface String {
    base64ToHex(): string;
    hexBigNumberToString(): string;
    makeId(length: number): string;
    hexToNumber(): number;
    hexToAscii(): string;
  }
}

String.prototype.base64ToHex = function () {
  const buffer = Buffer.from(this, 'base64');
  return buffer.toString('hex');
};


String.prototype.hexToNumber = function () {
  return parseInt(Buffer.from(this, 'hex').toString());
};

String.prototype.hexToAscii = function () {
  return Buffer.from(this, 'hex').toString();
};

String.prototype.makeId = function (length) {
  let result = '';
  const charactersLength = this.length;
  for (let i = 0; i < length; i++) {
    result += this.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

String.prototype.hexBigNumberToString = function () {
  return new BigNumber(this, 16).toString(10).toString();
};
export { };


"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const erdjs_1 = require("@elrondnetwork/erdjs");
const bignumber_js_1 = require("bignumber.js");
String.prototype.base64ToHex = function () {
    const buffer = Buffer.from(this, 'base64');
    return buffer.toString('hex');
};
String.prototype.bech32ToHex = function () {
    return new erdjs_1.Account(erdjs_1.Address.fromBech32(this)).address.hex();
};
String.prototype.base64ToBech32 = function () {
    const address = this.base64ToHex();
    return address.hexToBech32();
};
String.prototype.hexToBech32 = function () {
    return new erdjs_1.Account(erdjs_1.Address.fromHex(this)).address.bech32();
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
    return new bignumber_js_1.default(this, 16).toString(10).toString();
};
//# sourceMappingURL=string.js.map
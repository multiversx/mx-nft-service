"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnumType = exports.EnumUtils = void 0;
class EnumUtils {
    static getEnumKeys(enumObj, enumType) {
        return EnumUtils.getEnumValues(enumObj, enumType).map((value) => enumObj[value]);
    }
    static getEnumValues(enumObj, enumType) {
        return Object.keys(enumObj).filter((key) => typeof enumObj[key] === enumType);
    }
}
exports.EnumUtils = EnumUtils;
var EnumType;
(function (EnumType) {
    EnumType["Number"] = "number";
    EnumType["String"] = "string";
})(EnumType = exports.EnumType || (exports.EnumType = {}));
//# sourceMappingURL=enum-utils.js.map
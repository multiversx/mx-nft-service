"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryResponseHelper = void 0;
class QueryResponseHelper {
    static handleQueryAmountResponse(response) {
        var _a;
        return (_a = response === null || response === void 0 ? void 0 : response.returnData[0]) === null || _a === void 0 ? void 0 : _a.asBigInt.toFixed();
    }
    static getDataForCache(queryResponse) {
        return Object.assign(Object.assign({}, queryResponse), { returnData: queryResponse.returnData.map((r) => r.asBase64) });
    }
}
exports.QueryResponseHelper = QueryResponseHelper;
//# sourceMappingURL=query-response.helper.js.map
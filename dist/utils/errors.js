"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCodes = exports.DelegationContract = exports.Generic = void 0;
var Generic;
(function (Generic) {
    Generic["somethingWentWrong"] = "something_went_wrong";
    Generic["notSupported"] = "not_supported";
    Generic["notImplemented"] = "not_implemented";
    Generic["invalidInput"] = "invalid_input";
    Generic["notFound"] = "not_found";
    Generic["notConfigured"] = "not_configured";
})(Generic = exports.Generic || (exports.Generic = {}));
var DelegationContract;
(function (DelegationContract) {
    DelegationContract["errorCallingContract"] = "calling_contract";
    DelegationContract["errorContractConfig"] = "calling_contract_config";
    DelegationContract["providerNotFound"] = "provider_not_found";
})(DelegationContract = exports.DelegationContract || (exports.DelegationContract = {}));
exports.ErrorCodes = Object.assign(Object.assign({}, Generic), DelegationContract);
//# sourceMappingURL=errors.js.map
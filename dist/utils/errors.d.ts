export declare enum Generic {
    somethingWentWrong = "something_went_wrong",
    notSupported = "not_supported",
    notImplemented = "not_implemented",
    invalidInput = "invalid_input",
    notFound = "not_found",
    notConfigured = "not_configured"
}
export declare enum DelegationContract {
    errorCallingContract = "calling_contract",
    errorContractConfig = "calling_contract_config",
    providerNotFound = "provider_not_found"
}
export declare const ErrorCodes: {
    errorCallingContract: DelegationContract.errorCallingContract;
    errorContractConfig: DelegationContract.errorContractConfig;
    providerNotFound: DelegationContract.providerNotFound;
    somethingWentWrong: Generic.somethingWentWrong;
    notSupported: Generic.notSupported;
    notImplemented: Generic.notImplemented;
    invalidInput: Generic.invalidInput;
    notFound: Generic.notFound;
    notConfigured: Generic.notConfigured;
};

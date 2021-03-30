/**
 * Generic codes
 */
export enum Generic {
  somethingWentWrong = 'something_went_wrong',
  notSupported = 'not_supported',
  notImplemented = 'not_implemented',
  invalidInput = 'invalid_input',
  notFound = 'not_found',
  notConfigured = 'not_configured',
}

export enum DelegationContract {
  errorCallingContract = 'calling_contract',
  errorContractConfig = 'calling_contract_config',
  providerNotFound = 'provider_not_found',
}

/**
 * All error codes returned
 */
export const ErrorCodes = {
  ...Generic,
  ...DelegationContract,
};

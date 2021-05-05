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

/**
 * All error codes returned
 */
export const ErrorCodes = {
  ...Generic,
};

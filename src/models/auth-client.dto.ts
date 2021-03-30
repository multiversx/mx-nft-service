/**
 * Object for sending AuthClient info on API request
 */
export class AuthClientDTO {
  /**
   * Name of the auth client. Eg. ios, android, web
   */
  name: string;
  /**
   * Description for auth client
   */
  description: string;
}
/**
 * Object for specific clients accessing the API. E.g. iOS, Android, etc.
 */
export class AuthClient extends AuthClientDTO {
  /**
   * API key for the client.
   */
  key: string;
}

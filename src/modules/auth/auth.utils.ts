export class AuthUtils {
  static bypassAuthorizationOnTestnet(request: any) {
    if (
      (process.env.NODE_ENV === 'development' ||
        process.env.NODE_ENV === 'test') &&
      !!request.headers['x-nft-address']
    ) {
      const address = request.headers['x-nft-address'];
      request.auth = {
        address: address,
      };
      return true;
    }
    return false;
  }
}

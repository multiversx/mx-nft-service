export class AuthUtils {
  static bypassAuthorizationOnTestnet(request: any) {
    if (!!request.headers['x-nft-address'] && (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test')) {
      const address = request.headers['x-nft-address'];
      request.auth = {
        address: address,
      };
      return true;
    }
    return false;
  }
}

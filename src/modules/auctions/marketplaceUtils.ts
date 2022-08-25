export class MarketplaceUtils {
  public static readonly commonMarketplaceAbiPath: string =
    './src/abis/esdt-nft-marketplace.abi.json';

  public static readonly xoxnoMarketplaceAbiPath: string =
    './src/abis/xoxno-nft-marketplace.abi.json';

  public static readonly abiInterface: string = 'EsdtNftMarketplace';

  static isXoxnoMarketplace(marketplaceKey: string) {
    return marketplaceKey && marketplaceKey === 'xoxno';
  }
}

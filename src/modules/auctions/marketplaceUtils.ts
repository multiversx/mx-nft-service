import { MarketplaceTypeEnum } from '../marketplaces/models/MarketplaceType.enum';

export class MarketplaceUtils {
  public static readonly commonMarketplaceAbiPath: string = './src/abis/esdt-nft-marketplace.abi.json';

  public static readonly xoxnoMarketplaceAbiPath: string = './src/abis/xoxno-nft-marketplace.abi.json';

  public static readonly deployerMintersAbiPath: string = './src/abis/nft-minter-deployer.abi.json';

  public static readonly proxyDeployerMintersAbiPath: string = './src/abis/proxy-deployer.abi.json';

  static isExternalMarketplace(type: MarketplaceTypeEnum) {
    return type === MarketplaceTypeEnum.External;
  }
}

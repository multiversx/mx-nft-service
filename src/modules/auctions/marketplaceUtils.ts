import { MarketplaceTypeEnum } from '../marketplaces/models/MarketplaceType.enum';

export class MarketplaceUtils {
  public static readonly commonMarketplaceAbiPath: string =
    './src/abis/esdt-nft-marketplace.abi.json';

  public static readonly elrondNftSwapMarketplaceAbiPath: string =
    './src/abis/nft-swap.abi.json';

  public static readonly xoxnoMarketplaceAbiPath: string =
    './src/abis/xoxno-nft-marketplace.abi.json';

  public static readonly abiInterface: string = 'EsdtNftMarketplace';
  public static readonly elrondNftSwapInterface: string = 'EsdtNftMarketplace';

  static isExternalMarketplace(type: MarketplaceTypeEnum) {
    return type === MarketplaceTypeEnum.External;
  }
}

export function getMarketplaceKeyFilter(alias: string, marketplaceKey: string): string {
  return marketplaceKey ? `AND ${alias}.marketplaceKey = '${marketplaceKey}'` : '';
}

export function getAccountStatsQuery(addresses: string[]) {
  return `SELECT
    (SELECT COUNT(*) FROM auctions a WHERE a.ownerAddress = '${addresses[0]}' and a.status  in ('Running', 'Claimable')) as auctionsCount, 
    (SELECT COUNT(*) FROM orders o  WHERE o.ownerAddress= '${addresses[0]}' and o.status in ('Active', 'Bought')) as table2Count`;
}

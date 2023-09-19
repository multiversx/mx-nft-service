import { getMarketplaceKeyFilter } from '../collection-stats/sqlUtils';

export function getPublicAccountStatsQuery(address: string, marketplaceKey: string) {
  return `
  WITH 
  auctionsStats AS (SELECT COUNT(*) auctions,	a.ownerAddress AS address FROM	auctions a
      WHERE
          a.ownerAddress = '${address}'
          AND a.status in ('Running', 'Claimable')
          ${getMarketplaceKeyFilter('a', marketplaceKey)}
          AND a.startDate <= UNIX_TIMESTAMP(CURRENT_TIMESTAMP)
      ), 
      
    ordersCount AS (SELECT COUNT(DISTINCT o.auctionId) orders, o.ownerAddress
      FROM orders o
      INNER JOIN auctions a ON a.id=o.auctiONId
      WHERE o.ownerAddress = '${address}'
      AND o.status in ('Active','Inactive') AND a.status='Running' 
      ${getMarketplaceKeyFilter('a', marketplaceKey)}),
      biddingBalanceOrders AS (SELECT SUM(o.priceAmountDenominated) AS biddingBalance, o.ownerAddress AS orderAddress
      FROM orders o WHERE o.ownerAddress = '${address}' AND o.status ='Active' 
      ${getMarketplaceKeyFilter('o', marketplaceKey)}
      ) 
  
SELECT auctions, IF(orders, orders,0) AS orders, if(biddingBalance, biddingBalance, 0) AS biddingBalance, address
FROM
  (
  SELECT * from auctionsStats a
  LEFT JOIN ordersCount b ON b.ownerAddress = '${address}'
  LEFT JOIN biddingBalanceOrders bb ON bb.orderAddress = '${address}'
  ) temp
  `;
}

export function getBiddingBalanceQuery(address: string, marketplaceKey: string) {
  return `
  SELECT SUM(o.priceAmountDenominated) AS biddingBalance, o.ownerAddress AS orderAddress, o.priceToken
      FROM orders o WHERE o.ownerAddress = '${address}' AND o.status ='Active' 
            ${getMarketplaceKeyFilter('o', marketplaceKey)}
      GROUP BY priceToken 
  `;
}

export function getOwnerAccountStatsQuery(address: string, marketplaceKey: string) {
  return `
  WITH 
  auctionsStats AS (SELECT COUNT(*) auctions,	a.ownerAddress AS address FROM	auctions a
      WHERE
          a.ownerAddress = '${address}'
          AND a.status in ('Running', 'Claimable')
          ${getMarketplaceKeyFilter('a', marketplaceKey)}), 
      
    ordersCount AS (SELECT COUNT(DISTINCT o.auctionId) orders, o.ownerAddress
      FROM orders o
      INNER JOIN auctions a ON a.id=o.auctionId
      WHERE o.ownerAddress = '${address}'
      AND o.status in ('Active','Inactive') AND a.status='Running'
      ${getMarketplaceKeyFilter('a', marketplaceKey)}),
      biddingBalanceOrders AS (SELECT SUM(o.priceAmountDenominated) AS biddingBalance, o.ownerAddress AS orderAddress
      FROM orders o WHERE o.ownerAddress = '${address}' AND o.status ='Active' 
      ${getMarketplaceKeyFilter('o', marketplaceKey)}) 
  
SELECT auctions, IF(orders, orders,0) AS orders, if(biddingBalance, biddingBalance, 0) AS biddingBalance, address
FROM
  (
  SELECT * from auctionsStats a
  LEFT JOIN ordersCount b ON b.ownerAddress = '${address}'
  LEFT JOIN biddingBalanceOrders bb ON bb.orderAddress = '${address}'
  ) temp
  `;
}

import { mxConfig } from 'src/config';
import { getMarketplaceKeyFilter } from './sqlUtils';

export function getCollectionStats(identifier: string, marketplaceKey: string = undefined, paymentToken: string = mxConfig.egld) {
  return `
  WITH
    endedAuctions AS (select  SUM(o.priceAmountDenominated) AS volumeTraded, 
      AVG(o.priceAmountDenominated) AS saleAverage,
      MAX(o.priceAmountDenominated) AS maxPrice,
      SUM(if(a.status='Ended', 1, 0)) AS auctionsEnded,
      a.collection AS endedIdentifier
    FROM orders o 
    LEFT JOIN auctions a ON o.auctionId = a.id 
    WHERE a.collection  = '${identifier}' AND o.status = 'Bought' ${getMarketplaceKeyFilter('o', marketplaceKey)}),

    activeAuctions AS (SELECT MIN(if(o.priceAmountDenominated, o.priceAmountDenominated , a.minBidDenominated)) AS minPrice, 
    COUNT(DISTINCT(a.id)) AS activeAuctions,
    a.collection AS activeIdentifier
    FROM auctions a
    LEFT JOIN orders o ON o.auctionId = a.id AND (o.status ='Active' OR o.status = 'Bought')
    WHERE a.collection  = '${identifier}' AND a.status = 'Running' AND a.paymentToken='${paymentToken}' ${getMarketplaceKeyFilter(
    'a',
    marketplaceKey,
  )}) 

    SELECT volumeTraded, saleAverage, maxPrice, auctionsEnded, activeAuctions, minPrice
    FROM (
    SELECT * FROM endedAuctions ea
    LEFT JOIN activeAuctions aa ON aa.activeIdentifier = '${identifier}'
    ) temp
  `;
}

export function getCollectionFloorPrice(identifier: string, marketplaceKey: string = undefined, paymentToken: string = mxConfig.egld) {
  return `
  SELECT MIN(if(o.priceAmountDenominated, o.priceAmountDenominated , a.minBidDenominated)) AS minPrice
    FROM auctions a
    LEFT JOIN orders o ON o.auctionId = a.id AND o.status ='Active'
    WHERE a.collection  = '${identifier}' AND a.status = 'Running' AND a.paymentToken='${paymentToken}' ${getMarketplaceKeyFilter(
    'a',
    marketplaceKey,
  )}
  `;
}

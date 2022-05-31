export function getCollectionStats(identifier: string) {
  return `
  WITH
    endedAuctions AS (select  SUM(o.priceAmountDenominated) as volumeTraded, 
      AVG(o.priceAmountDenominated) as saleAverage,
      MAX(o.priceAmountDenominated) as maxPrice,
      SUM(if(a.status='Ended', 1, 0)) as auctionsEnded,
      a.collection as endedIdentifier
    from orders o 
    left join auctions a on o.auctionId = a.id 
    where a.collection  = '${identifier}' and o.status = 'Bought'),

    activeAuctions AS (select  MIN(if(o.priceAmountDenominated, o.priceAmount , a.minBid)) as minPrice, 
      SUM(if(a.status='Running', 1, 0)) as activeAuctions,
      a.collection as activeIdentifier
    from orders o 
    left join auctions a on o.auctionId = a.id 
    where a.collection  = '${identifier}' and o.status = 'Active' ) 

    SELECT volumeTraded, saleAverage, maxPrice, auctionsEnded, activeAuctions, minPrice
    FROM (
    SELECT * from endedAuctions ea
    LEFT JOIN activeAuctions aa on aa.activeIdentifier = '${identifier}'
    ) temp
  `;
}

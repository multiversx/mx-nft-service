import { DateUtils } from 'src/utils/date-utils';

export function getDefaultAuctionsForIdentifierQuery(
  identifier: string,
  endDate: number,
  limit: number = 10,
  offset: number = 0,
) {
  return `(SELECT a.*,o.priceAmountDenominated as price,a.endDate as eD
        FROM auctions a 
        LEFT JOIN orders o ON o.auctionId=a.id 
        WHERE a.status='Running' AND a.identifier = '${identifier}'
         AND a.endDate BETWEEN ${DateUtils.getCurrentTimestamp()} AND ${endDate}  
         AND IF(o.status='active' AND o.priceAmountDenominated=a.maxBidDenominated, 0, 1))
        UNION All 
        (SELECT a.*, o.priceAmountDenominated as price, 163497781945 as eD
        FROM auctions a 
        LEFT JOIN orders o ON o.auctionId=a.id 
        WHERE a.status='Running' AND a.identifier = '${identifier}' AND a.endDate> ${endDate} 
        AND IF(o.status='active' AND o.priceAmountDenominated=a.maxBidDenominated, 0, 1))
        order by eD, if(price, price, minBidDenominated) ASC limit ${limit} offset ${offset}`;
}
export function getDefaultAuctionsForIdentifierQueryCount(
  identifier: string,
  endDate: number,
) {
  return `SELECT COUNT(1) as Count from ((SELECT a.*,o.priceAmountDenominated as price,a.endDate as eD
    FROM auctions a 
    LEFT JOIN orders o ON o.auctionId=a.id 
    WHERE a.status='Running' AND a.identifier = '${identifier}'
     AND a.endDate BETWEEN ${DateUtils.getCurrentTimestamp()} AND ${endDate} 
     AND IF(o.status='active' AND o.priceAmountDenominated=a.maxBidDenominated, 0, 1))
    UNION All 
    (SELECT a.*, o.priceAmountDenominated as price, 163497781945 as eD
    FROM auctions a 
    LEFT JOIN orders o ON o.auctionId=a.id 
    WHERE a.status='Running' AND a.identifier = '${identifier}' AND a.endDate> ${endDate}    
    AND IF(o.status='active' AND o.priceAmountDenominated=a.maxBidDenominated, 0, 1))
    order by eD, if(price, price, minBidDenominated) ASC) as temp`;
}

export function getDefaultAuctionsQuery(endDate: number) {
  return `((SELECT a.*,o.priceAmountDenominated as price,a.endDate as eD
    FROM auctions a 
    LEFT JOIN orders o ON o.auctionId=a.id 
    WHERE a.status='Running'  AND a.endDate BETWEEN ${DateUtils.getCurrentTimestamp()} AND ${endDate} 
    AND IF(o.status='active' AND o.priceAmountDenominated=a.maxBidDenominated, 0, 1))
    UNION All 
    (SELECT a.*, o.priceAmountDenominated as price, 163497781945 as eD
    FROM auctions a 
    LEFT JOIN orders o ON o.auctionId=a.id 
    WHERE a.status='Running'   AND a.endDate> ${endDate}
    AND IF(o.status='active' AND o.priceAmountDenominated=a.maxBidDenominated, 0, 1))
    order by eD, if(price, price, minBidDenominated) ASC )) as temp`;
}

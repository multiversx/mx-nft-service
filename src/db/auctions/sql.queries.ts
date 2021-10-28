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

export function getAvailableTokensScriptsByIdentifiers(identifiers: string[]) {
  return `
SELECT SUM(countA) as count, identifier
  FROM (
    (SELECT
		  Sum(a.nrAuctionedTokens) countA,
		  a.identifier
	  FROM
		auctions a
	  WHERE a.status = 'Running'
		AND a.type <> 'SftOnePerPayment'
		AND a.endDate > UNIX_TIMESTAMP(CURRENT_TIMESTAMP)
		AND NOT EXISTS (
		SELECT 1 from orders o
		WHERE a.id = o.auctionId
      AND o.status = 'active'
			AND a.maxBidDenominated = o.priceAmountDenominated)
      AND a.identifier in (${identifiers.map((value) => `'${value}'`)}) 
	  GROUP by a.identifier)
UNION 
    (SELECT max(temp.countA) as countA, temp.identifier
    FROM 
		(SELECT (Sum(a.nrAuctionedTokens) - if (availableTokens.total, sum(availableTokens.total),0)) as countA, a.identifier
	FROM 	auctions a
	left join 
		(SELECT sum(if(boughtTokensNo, boughtTokensNo, 1)) as total, o.auctionId
		from orders o
		group by o.auctionId ) availableTokens 
		on availableTokens.auctionId = a.id
	WHERE a.status = 'Running'
    AND a.type = 'SftOnePerPayment'
    AND a.endDate > UNIX_TIMESTAMP(CURRENT_TIMESTAMP)
    AND a.identifier in (${identifiers.map((value) => `'${value}'`)}) 
		GROUP by a.identifier, availableTokens.total) temp
  GROUP by temp.identifier)) ac
GROUP by identifier`;
}

export function getAvailableTokensbyAuctionIds(ids: number[]) {
  return `SELECT
	if(o.auctionId,
	a.nrAuctionedTokens - sum(if(boughtTokensNo, boughtTokensNo, 1)),
	a.nrAuctionedTokens) as availableTokens,
	a.id as auctionId
from
	auctions a
left join orders o on
	a.id = o.auctionId
WHERE
	a.id in (${ids})
GROUP BY
	a.id `;
}

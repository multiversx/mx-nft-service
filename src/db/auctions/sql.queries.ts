import { DateUtils } from 'src/utils/date-utils';

export function getDefaultAuctionsForIdentifierQuery(
  identifier: string,
  endDate: number,
  limit: number = 10,
  offset: number = 0,
) {
  return `(SELECT a.*,o.priceAmountDenominated as price,a.endDate as eD
    FROM auctions a 
    LEFT JOIN LATERAL 
    			  (select * from orders WHERE auctionId= a.id ORDER by 1 DESC limit 1) as o ON 1=1 
    WHERE a.status='Running' AND a.identifier = '${identifier}'
     AND a.endDate <= ${endDate})
    UNION All 
    (SELECT a.*, o.priceAmountDenominated as price, if(startDate> UNIX_TIMESTAMP(CURRENT_TIMESTAMP), 1634977819457,163497781945) as eD
    FROM auctions a 
     LEFT JOIN LATERAL 
    			  (select * from orders WHERE auctionId= a.id ORDER by 1 DESC limit 1) as o ON 1=1 
    WHERE a.status='Running' AND a.identifier = '${identifier}' AND a.endDate > ${endDate})
    order by eD, if(price, price, minBidDenominated) ASC limit ${limit} offset ${offset}`;
}
export function getDefaultAuctionsForIdentifierQueryCount(
  identifier: string,
  endDate: number,
) {
  return `SELECT COUNT(1) as Count from ((SELECT a.*,o.priceAmountDenominated as price,a.endDate as eD
    FROM auctions a 
    LEFT JOIN LATERAL 
    			  (select * from orders WHERE auctionId= a.id ORDER by 1 DESC limit 1) as o ON 1=1 
    WHERE a.status='Running' AND a.identifier = '${identifier}'
     AND a.endDate <= ${endDate})
    UNION All 
    (SELECT a.*, o.priceAmountDenominated as price, if(startDate> UNIX_TIMESTAMP(CURRENT_TIMESTAMP), 1634977819457,163497781945) as eD
    FROM auctions a 
     LEFT JOIN LATERAL 
    			  (select * from orders WHERE auctionId= a.id ORDER by 1 DESC limit 1) as o ON 1=1 
    WHERE a.status='Running' AND a.identifier = '${identifier}' AND a.endDate> ${endDate})
    order by eD, if(price, price, minBidDenominated) ASC) as temp`;
}

export function getDefaultAuctionsQuery(endDate: number) {
  return `((SELECT a.*,o.priceAmountDenominated as price,a.endDate as eD
    FROM auctions a 
    LEFT JOIN LATERAL 
    			  (select * from orders WHERE auctionId= a.id ORDER by 1 DESC limit 1) as o ON 1=1 
    WHERE a.status='Running' AND a.endDate <= ${endDate})
    UNION All 
    (SELECT a.*, o.priceAmountDenominated as price, if(startDate> UNIX_TIMESTAMP(CURRENT_TIMESTAMP), 1634977819457,163497781945) as eD
    FROM auctions a 
    LEFT JOIN LATERAL 
    (select * from orders WHERE auctionId= a.id ORDER by 1 DESC limit 1) as o ON 1=1 
    WHERE a.status='Running' AND a.endDate> ${endDate}))
    order by eD, if(price, price, minBidDenominated) ASC ) as temp`;
}

export function getLowestAuctionForIdentifiers(
  endDate: number,
  identifiers: string[],
) {
  return `WITH 
  endingSoon AS (SELECT a.*,o.priceAmountDenominated as price,a.endDate as eD
          FROM auctions a 
          LEFT JOIN LATERAL 
          (select * from orders WHERE auctionId= a.id ORDER by 1 DESC limit 1) as o ON 1=1 
          WHERE a.status='Running' AND a.identifier in (${identifiers.map(
            (value) => `'${value}'`,
          )})
           AND a.endDate <= ${endDate}),   
  minPrice AS (SELECT a.*, o.priceAmountDenominated as price, if(startDate> UNIX_TIMESTAMP(CURRENT_TIMESTAMP), 1634977819457,163497781945) as eD
        FROM auctions a 
        LEFT JOIN LATERAL 
        (select * from orders WHERE auctionId= a.id ORDER by 1 DESC limit 1) as o ON 1=1 
        WHERE a.status='Running' AND a.identifier in (${identifiers.map(
          (value) => `'${value}'`,
        )})  AND a.endDate> ${endDate})
     
SELECT temp.* from (
  SELECT temp.*, row_number() over (partition by identifier order by eD, if(price, price, minBidDenominated) ASC) as seqnum
   from (
     select * from endingSoon       
    UNION All 
    select * from minPrice   
  order by eD, if(price, price, minBidDenominated) ASC
  ) as temp) temp
  WHERE  temp.seqnum <=1;
`;
}

export function getAuctionsForAsset(
  identifiers: string[],
  offset: number = 0,
  limit: number = 2,
) {
  return `
  SELECT temp.*, CONCAT(temp.identifier,"_",${offset},"_",${limit}) as batchKey from (
    SELECT temp.*,
      row_number() over (partition by identifier order by id ASC) as seqnum,
      COUNT(identifier) OVER(partition by identifier) as totalCount 
    from
      (
      SELECT a.* FROM auctions a
      WHERE a.identifier IN (${identifiers.map((value) => `'${value}'`)})
        AND a.status = 'Claimable'
      order by id ASC
    ) as temp) temp
  WHERE temp.seqnum > ${offset} and temp.seqnum <= ${offset + limit};`;
}

export function getOrdersForAuctions(
  ids: string[],
  offset: number = 0,
  limit: number = 2,
) {
  return `
  SELECT temp.*, CONCAT(temp.auctionId,"_",${offset},"_",${limit}) as batchKey from (
    SELECT temp.*,
      row_number() over (partition by auctionId order by priceAmount DESC) as seqnum,
      COUNT(auctionId) OVER(partition by auctionId) as totalCount 
    from
      (
      SELECT * FROM orders
      WHERE auctionId IN (${ids.map((value) => `'${value}'`)})
      order by priceAmount DESC
    ) as temp) temp
  WHERE temp.seqnum > ${offset} and temp.seqnum <= ${offset + limit};`;
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

export function getAuctionsForIdentifierSortByPrice(
  identifier: string,
  limit: number = 10,
  offset: number = 0,
) {
  return `SELECT a.*,o.priceAmountDenominated as price
  FROM auctions a 
  LEFT JOIN LATERAL 
  (select * from orders WHERE auctionId= a.id ORDER by 1 DESC limit 1) as o ON 1=1 
  WHERE a.status='Running' AND a.identifier = '${identifier}'
  order by if(price, price, minBidDenominated) ASC limit ${limit} offset ${offset}`;
}

export function getAuctionsForIdentifierSortByPriceCount(identifier: string) {
  return `SELECT COUNT(1) as Count from (SELECT a.*,o.priceAmountDenominated as price
  FROM auctions a 
  LEFT JOIN LATERAL 
  (select * from orders WHERE auctionId= a.id ORDER by 1 DESC limit 1) as o ON 1=1 
  WHERE a.status='Running' AND a.identifier='${identifier}'
   order by if(price, price, minBidDenominated) ASC) as temp`;
}

export function getAuctionsOrderByNoBidsQuery() {
  return `SELECT	a.*	FROM auctions a
    	LEFT JOIN orders o ON o.auctionId = a.id
		  WHERE	a.status = 'Running'
		  GROUP BY a.id
		  ORDER BY COUNT(a.Id) DESC) as temp GROUP BY temp.id`;
}

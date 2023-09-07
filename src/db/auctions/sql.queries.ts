import { QueryRequest } from 'src/modules/common/filters/QueryRequest';

export function getDefaultAuctionsForIdentifierQuery(
  queryRequest: QueryRequest,
  identifier: string,
  limit: number = 10,
  offset: number = 0,
  status: string[] = ['Running', 'Claimable'],
) {
  let supplementalFilters = new AuctionFilterBuilder(queryRequest).addIfExists('marketplaceKey').build();
  return `SELECT a.*, o.priceAmountDenominated as price
    FROM auctions a 
     LEFT JOIN LATERAL 
    			  (select * from orders WHERE auctionId= a.id ORDER by 1 DESC limit 1) as o ON 1=1 
    WHERE a.status in (${status.map((value) => `'${value}'`)}) AND a.identifier = '${identifier}' ${supplementalFilters}
    order by if(price, price, minBidDenominated) ASC limit ${limit} offset ${offset}`;
}

export function getDefaultAuctionsForIdentifierQueryCount(
  queryRequest: QueryRequest,
  identifier: string,
  status: string[] = ['Running', 'Claimable'],
) {
  let supplementalFilters = new AuctionFilterBuilder(queryRequest).addIfExists('marketplaceKey').build();
  return `SELECT COUNT(1) as Count from (SELECT a.*, o.priceAmountDenominated as price
    FROM auctions a 
     LEFT JOIN LATERAL 
    			  (select * from orders WHERE auctionId= a.id ORDER by 1 DESC limit 1) as o ON 1=1 
    WHERE a.status in (${status.map((value) => `'${value}'`)}) AND a.identifier = '${identifier}' ${supplementalFilters}
    order by if(price, price, minBidDenominated) ASC) as temp`;
}

export function getOnSaleAssetsCountForCollection(collections: string[]) {
  return `SELECT COUNT(DISTINCT a.identifier) as Count, a.collection FROM auctions a
    WHERE a.status = 'Running' AND a.collection IN (${collections.map((value) => `'${value}'`)})
   GROUP BY a.collection`;
}

export function getDefaultAuctionsQuery(queryRequest: QueryRequest) {
  let supplementalFilters = new AuctionFilterBuilder(queryRequest)
    .addIfExists('collection')
    .addIfExists('paymentToken')
    .addIfExists('marketplaceKey')
    .build();

  const result = `((SELECT a.*,o.priceAmountDenominated as price
    FROM auctions a 
    LEFT JOIN LATERAL 
    			  (select * from orders WHERE auctionId= a.id ORDER by 1 DESC limit 1) as o ON 1=1 
    WHERE a.status='Running' AND a.startDate <= UNIX_TIMESTAMP(CURRENT_TIMESTAMP)
       ${supplementalFilters}))
    order by if(price, price, minBidDenominated) ASC ) as temp`;

  return result;
}

export function getLowestAuctionForIdentifiers(identifiers: string[]) {
  return `
  SELECT a.*, o.priceAmountDenominated AS price
        FROM auctions a 
        LEFT JOIN LATERAL 
        (select * from orders WHERE auctionId= a.id ORDER by 1 DESC limit 1) AS o ON 1=1 
        WHERE a.status='Running' AND a.identifier IN (${identifiers.map(
          (value) => `'${value}'`,
        )})  AND a.startDate <= UNIX_TIMESTAMP(CURRENT_TIMESTAMP)
        ORDER by if(price, price, minBidDenominated)
`;
}

export function getLowestAuctionForIdentifiersAndMarketplace(identifiers: string[], marketplaceKey: string) {
  return `
  SELECT a.*, o.priceAmountDenominated as price, CONCAT(a.identifier,"_",'${marketplaceKey}') AS identifierKey
  FROM auctions a 
  LEFT JOIN LATERAL 
  (SELECT * from orders WHERE auctionId= a.id ORDER by 1 DESC limit 1) AS o ON 1=1 
  WHERE a.status='Running' AND a.marketplaceKey='${marketplaceKey}' AND a.identifier IN (${identifiers.map(
    (value) => `'${value}'`,
  )})  AND a.startDate <= UNIX_TIMESTAMP(CURRENT_TIMESTAMP)
  ORDER by if(price, price, minBidDenominated)
`;
}

export function getAuctionsForAsset(identifiers: string[], offset: number = 0, limit: number = 2) {
  return `
  SELECT temp.*, CONCAT(temp.identifier,"_",${offset},"_",${limit}) as batchKey from (
    SELECT temp.*,
      row_number() over (partition by identifier order by id ASC) as seqnum,
      COUNT(identifier) OVER(partition by identifier) as totalCount 
    from
      (
      SELECT a.* FROM auctions a
      WHERE a.identifier IN (${identifiers.map((value) => `'${value}'`)})
        AND a.status = 'Running'
      order by id ASC
    ) as temp) temp
  WHERE temp.seqnum > ${offset} and temp.seqnum <= ${offset + limit};`;
}

export function getOrdersForAuctions(ids: string[], offset: number = 0, limit: number = 2) {
  return `
  SELECT temp.*, CONCAT(temp.auctionId,"_",${offset},"_",${limit}) as batchKey from (
    SELECT temp.*,
      row_number() over (partition by auctionId order by priceAmountDenominated DESC) as seqnum,
      COUNT(auctionId) OVER(partition by auctionId) as totalCount 
    from
      (
      SELECT * FROM orders
      WHERE auctionId IN (${ids.map((value) => `'${value}'`)})
      order by priceAmountDenominated DESC
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
    UNION ALL
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

export function getAvailableTokensbyAuctionId(id: number) {
  return `SELECT
	if(o.auctionId,
	a.nrAuctionedTokens - sum(if(boughtTokensNo, boughtTokensNo, 1)),
	a.nrAuctionedTokens) as availableTokens
from
	auctions a
left join orders o on
	a.id = o.auctionId
WHERE
	a.id = ${id}`;
}

export function getAuctionsForIdentifierSortByPrice(identifier: string, limit: number = 10, offset: number = 0) {
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

export function getCurrentPaymentTokens(marketplaceKey?: string, collectionIdentifier?: string) {
  let filter = marketplaceKey ? `AND a.marketplaceKey = '${marketplaceKey}'` : '';
  filter = `${filter} ${collectionIdentifier ? `AND a.collection = '${collectionIdentifier}'` : ''}`;
  return `SELECT DISTINCT paymentToken, COUNT(a.paymentToken) AS count FROM auctions a 
  WHERE a.status = 'RUNNING' ${filter}  GROUP BY a.paymentToken ORDER by count DESC`;
}

export class AuctionFilterBuilder {
  private queryFilter: string = '';
  private queryRequest: QueryRequest;
  constructor(queryRequest: QueryRequest) {
    this.queryRequest = queryRequest;
  }

  addIfExists(filterName: string): this {
    const filter = this.queryRequest.getFilterName(filterName);
    if (filter) {
      this.queryFilter += ` AND a.${filterName} = '${filter}'`;
    }

    return this;
  }

  build(): string {
    return this.queryFilter;
  }
}

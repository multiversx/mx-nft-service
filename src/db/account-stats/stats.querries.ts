export function getAccountStatsQuery(address: string) {
  return `
  WITH 
	auctionsStats as (SELECT COUNT(*) auctions,	a.ownerAddress as address FROM	auctions a
		WHERE
			a.ownerAddress = '${address}'
			AND a.status in ('Running', 'Claimable')
		GROUP By a.ownerAddress), 
		
  ordersCount as (SELECT COUNT(*) orders, SUM(o.priceAmountDenominated) as biddingBalance, ownerAddress  FROM orders o
		WHERE o.ownerAddress = '${address}'
			AND o.status in ('Bought', 'Active')
		GROUP By ownerAddress)
    
 SELECT auctions, orders, biddingBalance, address
from
	(
	select * from auctionsStats a
	left join ordersCount b on a.address = b.ownerAddress
	GROUP by a.address) temp
  
  `;
}

export function getAccountClaimableCount(address: string) {
  return `
    WITH 
    auctionsCount as 
    (SELECT COUNT(DISTINCT a.id) ownerCount, a.ownerAddress as address
  from auctions a
  WHERE a.status = 'Claimable'
      and a.ownerAddress = '${address}'
  GROUP by a.ownerAddress ),
    ordersAuctionsCount as 
    (SELECT COUNT(DISTINCT o.auctionId) bidderCount, o.ownerAddress
  from orders o
  WHERE o.status = 'Active'
      and o.ownerAddress = '${address}'
  GROUP by o.ownerAddress )
    
  SELECT ownerCount + if(bidderCount, bidderCount, 0) as claimable, address
  from
      (select * from auctionsCount a
      left join ordersAuctionsCount b on a.address = b.ownerAddress
      GROUP by a.address) temp    
    `;
}

export function getAccountStatsQuery(address: string) {
  return `
  WITH 
  auctionsStats as (SELECT COUNT(*) auctions,	a.ownerAddress as address FROM	auctions a
      WHERE
          a.ownerAddress = '${address}'
          AND a.status in ('Running', 'Claimable')
      ), 
      
    ordersCount as (SELECT COUNT(*) orders, SUM(o.priceAmountDenominated) as biddingBalance, ownerAddress  FROM orders o
      WHERE o.ownerAddress = '${address}'
          AND o.status = 'Active'
      )
  
SELECT auctions, if(orders, orders,0) as orders, if(biddingBalance, biddingBalance, 0) as biddingBalance, address
from
  (
  select * from auctionsStats a
  left join ordersCount b on a.address = b.ownerAddress
  ) temp
  `;
}

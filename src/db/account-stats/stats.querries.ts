export function getAccountStatsQuery(address: string) {
  return `
  WITH 
  auctionsStats as (SELECT COUNT(*) auctions,	a.ownerAddress as address FROM	auctions a
      WHERE
          a.ownerAddress = '${address}'
          AND a.status in ('Running', 'Claimable')
      ), 
      
    ordersCount as (SELECT COUNT(*) orders, o.ownerAddress
      FROM orders o
      INNER JOIN auctions a on a.id=o.auctionId
      WHERE o.ownerAddress = '${address}'
      AND o.status in ('Active','Inactive') AND a.status='Running'
      ),
      biddingBalanceOrders as (SELECT SUM(o.priceAmountDenominated) as biddingBalance, o.ownerAddress as orderAddress
      from orders o WHERE o.ownerAddress = '${address}'
            AND o.status ='Active'
      ) 
  
SELECT auctions, if(orders, orders,0) as orders, if(biddingBalance, biddingBalance, 0) as biddingBalance, address
from
  (
  select * from auctionsStats a
  left join ordersCount b on a.address = b.ownerAddress
  left join biddingBalanceOrders bb on a.address = bb.orderAddress
  ) temp
  `;
}

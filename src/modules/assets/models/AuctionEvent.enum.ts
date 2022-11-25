export enum AuctionEventEnum {
  AuctionTokenEvent = 'auctionToken',
  EndAuctionEvent = 'endAuction',
  BidEvent = 'bid',
  BuySftEvent = 'buySft',
  WithdrawEvent = 'withdraw',
}

export enum ExternalAuctionEventEnum {
  Listing = 'listing',
  Buy = 'buy',
  BuyNft = 'buyNft',
  BulkBuy = 'bulkBuy',
  ChangePrice = 'changePrice',
  UpdatePrice = 'updatePrice',
  AcceptOffer = 'acceptOffer',
  UpdateOffer = 'update_offer_event',
  AcceptGlobalOffer = 'acceptGlobalOffer',
}

export enum ElrondNftsSwapAuctionEventEnum {
  NftSwap = 'nftSwap',
  WithdrawSwap = 'withdrawSwap',
  NftSwapUpdate = 'nftSwapUpdate',
  NftSwapExtend = 'nftSwapExtend',
  Purchase = 'purchase',
  Bid = 'bid',
  UpdateListing = 'update_listing',
}

export enum StakeNftEventsEnum {
  Stake = 'stake',
  Unstake = 'unstake',
}

export enum NftEventEnum {
  ESDTNFTAddQuantity = 'ESDTNFTAddQuantity',
  ESDTNFTTransfer = 'ESDTNFTTransfer',
  MultiESDTNFTTransfer = 'MultiESDTNFTTransfer',
  ESDTNFTCreate = 'ESDTNFTCreate',
  ESDTNFTBurn = 'ESDTNFTBurn',
  ESDTNFTUpdateAttributes = 'ESDTNFTUpdateAttributes',
}

export enum NftEventTypeEnum {
  NftEventEnum = 'NftEventEnum',
  AuctionEventEnum = 'AuctionEventEnum',
  ExternalAuctionEventEnum = 'ExternalAuctionEventEnum',
  ElrondNftsSwapAuctionEventEnum = 'ElrondNftsSwapAuctionEventEnum',
  StakeNftEventsEnum = 'StakeNftEventsEnum',
}

export enum MinterEventEnum {
  brandCreated = 'brandCreated',
  callBack = 'callBack',
  buyRandomNft = 'buyRandomNft',
  nftGiveaway = 'nftGiveaway',
}

export enum CollectionEventEnum {
  IssueSemiFungible = 'issueSemiFungible',
  IssueNonFungible = 'issueNonFungible',
}

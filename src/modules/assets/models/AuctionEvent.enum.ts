export enum AuctionEventEnum {
  AuctionTokenEvent = 'auctionToken',
  EndAuctionEvent = 'endAuction',
  BidEvent = 'bid',
  BuySftEvent = 'buySft',
  WithdrawEvent = 'withdraw',
}

export enum ExternalAuctionEventEnum {
  Listing = 'listing',
  WithdrawEvent = 'withdraw',
}

export enum NftEventEnum {
  ESDTNFTAddQuantity = 'ESDTNFTAddQuantity',
  ESDTNFTTransfer = 'ESDTNFTTransfer',
  MultiESDTNFTTransfer = 'MultiESDTNFTTransfer',
  ESDTNFTCreate = 'ESDTNFTCreate',
  ESDTNFTBurn = 'ESDTNFTBurn',
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

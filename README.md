GraphQl service to provide informations regarding nfts and auctions on Elrond Blockchain

## Dependencies

1. Node.js > @16.x.x is required to be installed [docs](https://nodejs.org/en/)
1. Redis Server is required to be installed [docs](https://redis.io/).
2. MySQL Server is required to be installed [docs](https://dev.mysql.com/doc/refman/8.0/en/installing.html). 
3. MongoDB Server is required to be installed [docs](https://www.mongodb.com/docs/manual/installation).

You can use `docker-compose up` in a separate terminal to use a local docker container for all these dependencies.

After running the sample, you can stop the Docker container with `docker-compose down`

## Available Scripts

This is an Elrond project built on Nest.js framework.

### `npm run start:prod`

Runs the app in the production mode.
Make requests to [http://localhost:3005/graphql](http://localhost:3005/graphql).

## Running the app

```bash
# development debug mode
$ npm run start:debug

# development mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

It depends on the following external systems:
- gateway: 
  - interaction with the indexed marketplace
  - docs: [https://docs.elrond.com/sdk-and-tools/proxy/](https://docs.elrond.com/sdk-and-tools/proxy/)
- index: 
  - to gather information regarding nft history
  - docs: [https://docs.elrond.com/sdk-and-tools/elastic-search/](https://docs.elrond.com/sdk-and-tools/elastic-search/)
- api: 
  - to get information regarding nfts and collections
  - docs: [https://docs.elrond.com/sdk-and-tools/rest-api/api-elrond-com](https://docs.elrond.com/sdk-and-tools/rest-api/api-elrond-com)

It uses on the following internal systems:
- redis: used to cache various data, for performance purposes
- rabbitmq: pub/sub for sending mainly NFT process information

It depends on the following optional external systems:
- events notifier rabbitmq: queue that pushes logs & events which are handled internally e.g. to trigger auctions indexing
- data: provides eGLD price information for transactions
- ipfs: ipfs gateway for uploading nft media and metadata
- AWS S3: used to upload nft media for faster performance

It uses the following optional internal systems:
- mysql database: used to store mainly auction information
- mongo database: used to store mainly NFT traits information


# witnet-price-feeds

This repository contains the price feeds currently mantained by the Witnet Foundation within all the EVM-compatible networks supported by the Witnet oracle. 

## Usage

### Install repo
- `npm install`
- `npm run flatten`

### List Witnet-supported networks
- `npm run avail:networks`

### List available price feeds
- `npm run avail:feeds`

### List deployed addresses
- See contents of `migrations/addresses.json`

### Create new Witnet price update query

- Add new `.js` file into `queries/` folder.
- Follow examples available in same folder, or [this tutorial](https://docs.witnet.io/smart-contracts/witnet-web-oracle/make-a-get-request).
- Compile JS queries into CBOR-encoded bytecodes:
  `npm run compile:queries`
  A new entry will be added to `migrations/witnet-queries.json` file, named after the new `.js`

### Try out Witnet price update queries
- Run this command:
  `npm run try-query:js <path_to_js_file>`

### Deploy new WitnetPriceFeed instance
- Specify fields `base`, `quote` and `decimals` within the corresponding entry in `migrations/witnet.request.json`, if not yet done so.
- Add empty string into the appropiate network section within `migrations/addresses.json` file, named after the Witnet price update request you want to deploy. E.g.:
  ```
  {
    ...    
    "boba": {
      ...
      "boba.mainnet": {
        ...
        "OmgBtcPriceFeed": """
      },  
    }
  }
- `npm run migrate <network.name>´
- Type "y" + [ENTER] when asked for permission to update the `WitnetPriceRouter` contract.

### Update an already deployed WitnetPriceFeed instance:
- Remove address from the corresponding entry within `migrations/addresses.json`
- `npm run migrate <network.name>`
- Type "y" + [ENTER] when asked for permission to update the `WitnetPriceRouter` contract.

# witnet-price-feeds

This repository contains the price feeds currently mantained by the Witnet Foundation within all the EVM-compatible networks supported by the Witnet oracle. 

## Usage

### Install repo
- `npm install`
- `npx witnet-toolkit update`
- `npm run flatten`

### List Witnet-supported networks
- `npm run avail:networks`

### List available price feeds
- `npm run avail:feeds`

### List deployed addresses
- See contents of `migrations/addresses.json`

### Create new Witnet price update request:

- Add new `.js` file into `requests/` folder.
- Follow examples available in same folder, or [this tutorial](https://docs.witnet.io/tutorials/bitcoin-price-feed/sources/).
- Compile requests into CBOR-encoded bytecodes:
  `npm run compile:requests`
  A new entry will be added to `migrations/witnet.requests.json` file, named after the new `.js`

### Try out Witnet price update requests:
- Copy the `<bytecode>` from the corresponding entry in `migrations/witnet.requests.json`, removing the `0x` prefix.
- Run this command:
  `npx witnet-toolkit try-data-request --hex <bytecode>`

### Deploy new WitnetPriceFeed instance:
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

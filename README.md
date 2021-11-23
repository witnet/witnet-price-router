# witnet-price-feed-examples

Witnet repository containing:
- Automatic generation of data feed Solidity contracts, based on [`witnet-request-js`](https://github.com/witnet/witnet-requests-js).
- Importing Witnet Bridge Smart Contracts official addresses, available in multiple testnets and mainnet.
- Price feed smart contract examples, demonstrating how Witnet framework can be integrated.
- Scripts for flattening and migrating a given price feed contract into selected network.

## Usage

### Deploy an instance of ERC2362PriceFeed for each Witnet Request

- First step is to flatten the deployable artifacts of this repository:

  ```console
    npm run flatten
  ```

- Secondly, rename the `.env_example` file to `.env`, and set a proper value to the `WITNET_EVM_REALM` environment variable, depending on the EVM-compatible blockchain (i.e. "realm") where you want to deploy to. Currently, the possible values are: `default`, `conflux` or `boba`. 

- Checkout configured networks to the realm specified in the `.env` file:

  ```console
     npm run avail 
  ```

  If you need to modify or add new network configurations, please properly edit the `networks` section within the `migrations/erc2362.settings.js` file.

- For deploying newly created examples:

  ```console
    npm run migrate <Network>
  ```

  This script will deploy an instance of the `ERC2362PriceFeed` implementation adapted to the active "realm", for every bytecode string found in the `migrations/witnet.requests.js` whose corresponding price feed contract address in `migrations/erc2362.addresses.json` is found to be empty. After deploying a new price feed contract, the script will automatically update the corresponding entry in the `migrations/erc2362.addresses.json` file.

- If you need to redeploy certain price feed contract (e.g. after making some modification in any of the files in `requests/`), make sure to delete the corresponding address in `migrations/erc2362.addresses.json` before running migrations again:

  ```console
    npm run migrate <Network>
  ```

### Verify your ERC2362PriceFeed instances

You may want to verify some or all of the price feed contracts in some of the supported realms. The flattened single-file source files can be found in `flattened/` subfolder, after running `npm run flatten`.

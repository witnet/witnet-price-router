# witnet-price-feed-examples

Witnet repository containing:
- Automatic generation of data feed Solidity contracts, based on [`witnet-request-js`](https://github.com/witnet/witnet-requests-js).
- Importing Witnet Bridge Smart Contracts official addresses, available in multiple testnets and mainnet.
- Price feed smart contract examples, demonstrating how Witnet framework can be integrated.
- Scripts for flattening and migrating a given price feed contract into selected network.

## Usage

### Create or modify your Witnet Data Requests

- Feel free to modify/remove/add source files at `requests/*.js`, following instructions in [this tutorial](https://docs.witnet.io/tutorials/bitcoin-price-feed/sources/).

- Convert your Request javascript source files into valid bytecode strings that will be used when deploying their respective Solidity contracts:
  
  ```console
    npm run compile:requests
  ```
  
  After compiling your source files, you will find the auto-generated list of bytecodes in `migrations/witnet.requests.json`. Within this file you may optionally add/modify the `decimals` and/or `ERC2362ID` fields for any of the auto-generated entries. If you do, their values will be kept even if you decide/need to recompile your Request source files. If you don't specify a value for the `ERC2362ID` for certain example, the migration script will try to compose it for you the first time that examples gets deployed. 

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

You may want to verify some or all of the price feed contracts in some of the supported realms. Currently, the price feed contracts can get verified in Ethereum (Etherscan) and Conflux (Conflux Explorer), but not in BOBA. Verification process can vary from one to realm to another, so follow the proper steps having into account the following data, depending on the targeted realm:

    | - | Ethereum | Conflux |
    | - | :------- | :------ | 
    | 
    | `BtcUsdPriceFeed` | 1,027,995
    | `CBOR` | 1,940,538
    | `EthUsdPriceFeed` | 1,039,394
    | `GoldEurPriceFeed` | 1,072,717
    | `Migrations` | 176,684
    | `Witnet` | 2,580,858
    | `WitnetProxy` | 357,748
    | `WitnetRequestBoard` | 1,705,089
    | | **9,901,023** (-5,8%)
  



- Some scripts are ready for you in case you wanted not only to deploy your data feed contracts, but also **verify** them into ***Etherscan***, or alike:    
  - Create one-single flattened Solidity file containing all the imports required by the smart contract to be verified:
    ```console
    yarn flatten contracts/ERC2362PriceFeed.sol
    ```
  - Migrate flattened contracts into the preferred network:
    ```console
    yarn migrate-flattened BtcUsdPriceFeed rinkeby
    ```
  - Verify the desired price feed contract into the preferred network:
    ```console
    yarn verify-flattened BtcUsdPriceFeed rinkeby
    ```

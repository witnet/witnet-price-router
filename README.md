# witnet-price-feed-examples

Witnet repository containing:
- Automatic generation of data feed Solidity contracts, based on [`witnet-request-js`](https://github.com/witnet/witnet-requests-js).
- Importing Witnet Bridge Smart Contracts official addresses, available in multiple testnets and mainnet.
- Price feed smart contract examples, demonstrating how Witnet framework can be integrated.
- Scripts for flattening, migrating and verifying a given price feed contract into selected network.

## Usage

- Feel free to modify/remove/add source files at `./requests/*.js`, following instructions in [this tutorial](https://docs.witnet.io/tutorials/bitcoin-price-feed/sources/).

- Convert your data request RADON scripts into actual Witnet Request contracts:
  ```console
  yarn compile:requests
  ```

- Feel free to modify/add your own Data Feed Solidity inside the `./contracts` directory. May you follow [this other tutorial](), or have a look to the included examples:
  `./contracts/BtcUsdPriceFeed.sol`
  `./contracts/EthUsdPriceFeed.sol`
  `./contracts/GoldEurPriceFeed.sol`
- When done, compile your contracts:
  ```console
  yarn compile
  ```
- For migrating your contracts, please revist first `./truffle-config.js`, setup desired network properly, and then:
   ```console
   yarn migrate --network rinkeby
   ```
- Some scripts are ready for you in case you wanted not only to deploy your data feed contracts, but also **verify** them into ***Etherscan***:
  - Get an API_KEY from [Etherscan](https://etherscan.io/apis).
  - Create a new file **`.env`** inside the root directory and complete the following line:
    ```console
    ETHERSCAN_API_KEY=<api_key>
    ```
  - Create one-single flattened Solidity file containing all the imports required by the smart contract to be verified:
    ```console
    yarn flatten contracts/BtcUsdPriceFeed.sol
    ```
  - Migrate flattened contracts into preferred network:
    ```console
    yarn migrate:flattened BtcUsdPriceFeed rinkeby
    ```
  - Verify desired artifact into preferred network:
    ```console
    yarn verify:flattened BtcUsdPriceFeed rinkeby
    ```

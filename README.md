# witnet-price-feed-examples

Witnet repository containing:
- Automatic generation of data feed Solidity contracts, based on [`witnet-request-js`](https://github.com/witnet/witnet-requests-js).
- Importing Witnet Bridge Smart Contracts official addresses, available in multiple testnets and mainnet.
- Price feed smart contract examples, demonstrating how Witnet framework can be integrated.
- Scripts for flattening, migrating and verifying a given price feed contract into selected network.

## Usage

- Feel free to modify/remove/add source files at `./requests/*.js`, following instructions in [this tutorial](https://docs.witnet.io/tutorials/bitcoin-price-feed/sources/).

- Convert your Witnet RADON scripts into actual Solidity contracts:
  ```console
  yarn compile:requests
  ```

  You will find a list of generated Radon scripts bytecodes in the auto-generated file `./migrations/radons.json`. 

- Feel free to modify/add your own Solidity contracts inside the `./contracts` directory. May you follow [this other tutorial](https://docs.witnet.io/tutorials/bitcoin-price-feed/contract/), or have a look to the included base example:
  `./contracts/ERC2362PriceFeed.sol`
  
- When done, compile your contracts:
  ```console
  yarn compile
  ```
- For migrating your contracts, please open first `./truffle-config.js`, setup the desired network properly, and then:
   ```console
   yarn migrate --network rinkeby
   ```
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

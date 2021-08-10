module.exports = {
  artifacts: {
    default: {
      ERC2362PriceFeed: "ERC2362PriceFeed",
    },
    omgx: {
      ERC2362PriceFeed: "ERC2362PriceFeedOVM",
    },
  },
  constructorParams: {
    default: {
      ERC2362PriceFeed: [],
    },
    omgx: {
      ERC2362PriceFeed: [
        '0x4200000000000000000000000000000000000006'  // _oETH_ERC20
      ],
    },
  },
  compilers: {
    default: {
      version: "0.8.6",
    },
    conflux: {
      evmVersion: "petersburg",
    },
    omgx: {
      version: "./node_modules/@eth-optimism/solc",
    },
  },
  networks: {
    default: {
      "ethereum.ropsten": {
        network_id: 3,
        host: "localhost",
        port: 8543,
      },
      "ethereum.rinkeby": {
        network_id: 4,
        host: "localhost",
        port: 8544,
      },
      "ethereum.goerli": {
        network_id: 5,
        host: "localhost",
        port: 8545,
      },
      "ethereum.kovan": {
        network_id: 42,
        host: "localhost",
        port: 8542,
      },
      "ethereum.mainnet": {
        network_id: 1,
        host: "localhost",
        port: 9545,
      },
    },
    conflux: {
      test: {
        host: "localhost",
        port: 8540,
        network_id: 1,
        gasPrice: 10,
        skipDryRun: true,
      },
      "conflux.testnet": {
        host: "localhost",
        port: 8540,
        network_id: 1,
        gasPrice: 10,
        skipDryRun: true,
      },
      "conflux.mainnet": {
        host: "localhost",
        port: 9540,
        network_id: 1029,
        gasPrice: 1,
        skipDryRun: true,
      },
    },
    omgx: {
      test: {
        network_id: 28,
        host: "localhost",
        port: 8539,
        gasPrice: 15000000,
        gas: 150000000,
        skipDryRun: true,
        networkCheckTimeout: 1000,
      },
      "omgx.rinkeby": {
        network_id: 28,
        host: "localhost",
        port: 8539,
        gasPrice: 15000000,
        gas: 150000000,
        skipDryRun: true,
        networkCheckTimeout: 1000,
      },
    },
  },
}

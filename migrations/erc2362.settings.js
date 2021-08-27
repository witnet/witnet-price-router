module.exports = {
  artifacts: {
    default: {
      ERC2362PriceFeed: "ERC2362PriceFeed",
    },
    boba: {
      ERC2362PriceFeed: "ERC2362PriceFeedBoba",
    },
  },
  constructorParams: {
    default: {
      ERC2362PriceFeed: [],
    },
    boba: {
      ERC2362PriceFeed: [
        '0x4200000000000000000000000000000000000006'  // _oETH_ERC20
      ],
    },
  },
  compilers: {
    default: {
      solc: {
        version: "0.8.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
        outputSelection: {
          "*": {
            "*": ["evm.bytecode"],
          },
        },
      },
    },
    conflux: {
      solc: {
        evmVersion: "petersburg",
      },
    },
    boba: {
      solc: {
        version: "./node_modules/@eth-optimism/solc"
      },
    },
    celo: {
      solc: {
        version: "0.8.7"
      }
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
        skipDryRun: true,
      },
      "ethereum.goerli": {
        network_id: 5,
        host: "localhost",
        port: 8545,
        skipDryRun: true,
      },
      "ethereum.kovan": {
        network_id: 42,
        host: "localhost",
        port: 8542,
        skipDryRun: true,
      },
      "ethereum.mainnet": {
        network_id: 1,
        host: "localhost",
        port: 9545,
      },
    },
    conflux: {
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
    boba: {
      "boba.rinkeby": {
        network_id: 28,
        host: "localhost",
        port: 8539,
        gasPrice: 15000000,
        gas: 150000000,
        skipDryRun: true,
      },
    },
    celo: {
      "celo.alfajores": {
        network_id: 44787,
        host: "localhost",
        port: 8538,
        skipDryRun: true,
      },
    }
  },
}

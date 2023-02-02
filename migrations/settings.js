const { merge } = require("lodash")

module.exports = {
  artifacts: merge({
      default: {
        WitnetPriceFeed: "WitnetPriceFeed",
      }
    },
    require("witnet-solidity-bridge/migrations/witnet.settings").artifacts
  ),
  compilers: require("witnet-solidity-bridge/migrations/witnet.settings").compilers, 
  networks: merge(
    require("witnet-solidity-bridge/migrations/witnet.settings").networks, {
      default: {
        "ethereum.mainnet": {
          skipDryRun: true,
          confirmations: 2
        },
        "ethereum.goerli": {
          gasPrice: 50 * 10 ** 9,
        }
      },
      conflux: {
        "conflux.espace.testnet": {
          gasPrice: 10 * 10 ** 9
        }
      },
      polygon: {
        "polygon.mainnet": {
          gasPrice: 50 * 10 ** 9
        },
      },
      arbitrum: {
        "arbitrum.goerli": {
          from: "0x8c49CAfC4542D9EA9107D4E48412ACEd2A68aA77",
        }
      }
    }
  )
}

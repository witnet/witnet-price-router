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
        }
      },
      conflux: {
        "conflux.mainnet": {
          gasPrice: 30 * 10 ** 9
        }
      },
      polygon: {
        "polygon.mainnet": {
          gasPrice: 50 * 10 ** 9
        }
      }
    }
  )
}

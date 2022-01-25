const { merge } = require("lodash")

module.exports = {
  artifacts: merge({
      default: {
        WitnetPriceFeed: "WitnetPriceFeed",
      }
    }, require("witnet-solidity-bridge/migrations/witnet.settings").artifacts
  ),
  compilers: require("witnet-solidity-bridge/migrations/witnet.settings").compilers,
  networks: merge(require("witnet-solidity-bridge/migrations/witnet.settings").networks, {
    default: {
      "ethereum.mainnet": {
        gas: 3000000,
        gasPrice: 100 * 10 ** 9,
        skipDryRun: true
      }
    },
    conflux: {
      "conflux.mainnet": {
        gasPrice: 30 * 10 ** 9
      }
    }
  })
}

const { merge } = require("lodash")

module.exports = {
  artifacts: merge({
      default: {
        WitnetPriceFeed: "WitnetPriceFeed",
      }
    }, require("witnet-solidity-bridge/migrations/witnet.settings").artifacts
  ),
  compilers: require("witnet-solidity-bridge/migrations/witnet.settings").compilers,
  networks: require("witnet-solidity-bridge/migrations/witnet.settings").networks
}

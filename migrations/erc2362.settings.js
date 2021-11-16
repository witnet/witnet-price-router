module.exports = {
  artifacts: {
    default: {
      ERC2362PriceFeed: "ERC2362PriceFeed",
    },
  },
  constructorParams: {
    default: {
      ERC2362PriceFeed: [],
    },
  },
  compilers: require("witnet-solidity-bridge/migrations/witnet.settings").compilers,
  networks: require("witnet-solidity-bridge/migrations/witnet.settings").networks
}

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
  compilers: require("witnet-ethereum-bridge/migrations/witnet.settings").compilers,
  networks: require("witnet-ethereum-bridge/migrations/witnet.settings").networks
}

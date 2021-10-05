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
        15000000, // _oGAS_PRICE
        '0x4200000000000000000000000000000000000006'  // _oETH_ERC20
      ],
    },
  },
  compilers: require("witnet-solidity-bridge/migrations/witnet.settings").compilers,
  networks: require("witnet-solidity-bridge/migrations/witnet.settings").networks
}

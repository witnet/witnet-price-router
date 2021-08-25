const realm = process.env.WITNET_EVM_REALM ? process.env.WITNET_EVM_REALM.toLowerCase() : "default"
const erc2362Addresses = require("../erc2362.addresses")[realm]
const erc2362Settings = require("../erc2362.settings")

const ERC2362PriceFeed = artifacts.require(
  erc2362Settings.artifacts[realm]
    ? erc2362Settings.artifacts[realm].ERC2362PriceFeed
    : erc2362Settings.artifacts.default.ERC2362PriceFeed
)

module.exports = async function (deployer, network) {
  network = network.split("-")[0]
  if (network !== "test") {
    console.error(`
Please, migrate examples by using the package manager:

  $ npm run migrate <network>

To list available data feed examples:

  $ npm run avail:examples

Enjoy the power of the Witnet Decentralized Oracle Network ;-)
    `)
    process.exit(1)
  }
  else {
    console.log("Info: no migrations needed at this point.\n")
  }
}

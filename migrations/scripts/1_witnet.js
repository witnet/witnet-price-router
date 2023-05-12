const addresses = require("witnet-solidity-bridge/migrations/witnet.addresses")
const utils = require("../../scripts/utils")

const WitnetPriceFeeds = artifacts.require("WitnetPriceFeeds")
const WitnetPriceRouter  = artifacts.require("WitnetPriceRouter")
const WitnetRequestBoard = artifacts.require("WitnetRequestBoard")

module.exports = async function (deployer, network, [, from]) {
  const isDryRun = network === "test" || network.split("-")[1] === "fork" || network.split("-")[0] === "develop"
  const ecosystem = utils.getRealmNetworkFromArgs()[0]
  network = network.split("-")[0]

  var witnetAddresses
  if (!isDryRun) {
    try {
      witnetAddresses = addresses[ecosystem][network]
      WitnetRequestBoard.address = witnetAddresses.WitnetRequestBoard
      const header = "Witnet artifacts:"
      console.info("\n  ", header)
      console.info("  ", ".".repeat(header.length))
      console.info("  ", "> WitnetRequestBoard: ", WitnetRequestBoard.address)
      if (witnetAddresses?.WitnetPriceRouter) {
        WitnetPriceRouter.address = witnetAddresses?.WitnetPriceRouter
        console.info("  ", "> WitnetPriceRouter:  ", WitnetPriceRouter.address)
      }
      if (witnetAddresses?.WitnetPriceFeeds) {
        WitnetPriceFeeds.address = witnetAddresses?.WitnetPriceFeeds
        console.info("  ", "> WitnetPriceFeeds:   ", WitnetPriceFeeds.address)
      }
    } catch (e) {
      console.error("Fatal: Witnet Foundation addresses were not provided!")
      console.error(e)
      process.exit(1)
    }
  } else {
    await deployer.deploy(WitnetPriceRouter, true, utils.fromAscii(network), { from, gas: 6721975 })
  }
}
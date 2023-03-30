const addresses = require("witnet-solidity-bridge/migrations/witnet.addresses")
const utils = require("../../scripts/utils")

const WitnetPriceRouter  = artifacts.require("WitnetPriceRouter")

module.exports = async function (deployer, network, [, from]) {
  const isDryRun = network === "test" || network.split("-")[1] === "fork" || network.split("-")[0] === "develop"
  const ecosystem = utils.getRealmNetworkFromArgs()[0]
  network = network.split("-")[0]

  var witnetAddresses
  if (!isDryRun) {
    try {
      witnetAddresses = addresses[ecosystem][network]
      WitnetPriceRouter.address = witnetAddresses.WitnetPriceRouter
      const header = "Witnet artifacts:"
      console.info(header)
      console.info("=".repeat(header.length))
      console.info("  ", "> WitnetPriceRouter: ", WitnetPriceRouter.address)
    } catch (e) {
      console.error("Fatal: Witnet Foundation addresses were not provided!")
      console.error(e)
      process.exit(1)
    }
  } else {
    await deployer.deploy(WitnetPriceRouter, true, utils.fromAscii(network), { from, gas: 6721975 })
  }
}
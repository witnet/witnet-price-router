const fs = require("fs")
const { merge } = require("lodash")
const utils = require("../../scripts/utils")

const addresses = require("../addresses")
const queries = require("../witnet-queries")
const settings = require("../settings")

module.exports = async function (deployer, network, [, from]) {
  const [realm, chain] = utils.getRealmNetworkFromString(network.split("-")[0])
  const isDryRun = network.split("-")[1] === "fork"
  if (chain !== "test" && chain.split(".")[1] !== "test") {
    let witnetAddresses
    try {
      witnetAddresses = require("witnet-solidity-bridge/migrations/witnet.addresses")[realm][chain]
    } catch (e) {
      console.error("Fatal: Witnet Foundation addresses were not provided!", e)
      process.exit(1)
    }

    if (!addresses[realm]) addresses[realm] = {}
    if (!addresses[realm][chain]) addresses[realm][chain] = {}

    const artifactNames = merge(
      settings.artifacts.default,
      settings.artifacts[realm]
    )

    let router
    let updateRegistry = !utils.isNullAddress(witnetAddresses.WitnetPriceRouter)
    if (updateRegistry) {
      router = await artifacts.require(artifactNames.WitnetPriceRouter).at(witnetAddresses.WitnetPriceRouter);
    }

    const pfs = Object.keys(queries)
    for (let i = 0; i < pfs.length; i++) {
      const pf_name = pfs[i]
      const pf = queries[pf_name]
      const contract_name = pf_name + "Feed"
      if (addresses[realm][chain][contract_name] !== undefined) {
        let contract_address = addresses[realm][chain][contract_name]
        // Ignore unrotued price feeds:
        if (pf.bytecode) {
          continue
        }
        // Deploy new contract if it still has no corresponding entry in the 'migrations/addresses.json' file:
        if (utils.isNullAddress(contract_address) && !pf.bytecode) {
          // If no bytecode is found, there should be a compiled artifact named as `exampleName + "Feed"`
          // and inherited from "WitnetPriceFeedRouted", that will be deployed instead of a regular WitnetPriceFeed:
          const WitnetPriceFeedRouted = artifacts.require(contract_name)
          const contract = await deployer.deploy(WitnetPriceFeedRouted, router.address, { from })
          contract_address = contract.address

          console.log("   > Artifact name:\t  \"" + contract_name + "\"")
          console.log("   > Contract name:\t  \"" + contract_name + "\"")

          // Write new contract address into 'migrations/addresses.json'
          addresses[realm][chain][contract_name] = contract_address
          if (!isDryRun) {
            fs.writeFileSync(
              "./migrations/addresses.json",
              JSON.stringify(addresses, null, 4),
              { flag: 'w+'}
            )
          }
        } else {
          const header = `Skipped '${contract_name}'`
          console.log("\n  ", header)
          console.log("  ", "-".repeat(header.length))
          console.log("   > contract address:\t", contract_address)
        }
        // Update Price Router if necessary:
        if (updateRegistry) {
          const caption = "Price-" + pf.base + "/" + pf.quote + "-" + pf.decimals
          const erc2362id = await router.currencyPairId.call(caption)
          console.log("\n   > ERC2362 caption:\t ", caption)
          console.log("   > ERC2362 id:     \t ", erc2362id)
          console.log("   > Router address:\t ", router.address)
          let currentPollerAddr = await router.getPriceFeed(erc2362id)
          if (!isDryRun && (utils.isNullAddress(currentPollerAddr) || currentPollerAddr !== contract_address)) {
            let answer = (await utils.prompt(`     ? Substitute current pricefeed at ${currentPollerAddr}? [y/N] `)).toLowerCase().trim()
            if (["y", "yes"].includes(answer)) {
              await router.setPriceFeed(
                contract_address,
                pf.decimals,
                pf.base,
                pf.quote,
                { from }
              )
              console.log("     > Done.")
            }
          }
        }
      }
    }
  }
}

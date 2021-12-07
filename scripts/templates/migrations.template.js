const fs = require("fs")
const { merge } = require("lodash")
const utils = require("../../scripts/utils")

const addresses = require("../../migrations/addresses")
const settings = require("../../migrations/settings")
const witnetRequests = require("../../migrations/witnet.requests")

const PricePoller = artifacts.require("#artifact")

module.exports = async function (deployer, network, _accounts) {
  network = network.split("-")[0]
  const realm = utils.getRealmNetworkFromString(network)[0]  
  let witnetAddresses
  try {    
    witnetAddresses = require("witnet-solidity-bridge/migrations/witnet.addresses")[realm][network]
  } catch {
    console.error("Fatal: Witnet addresses were not provided!")
    process.exit(1)
  }

  let registry
  let updateRegistry = !utils.isNullAddress(witnetAddresses.WitnetPriceRouter)
  if (updateRegistry) {
    let artifactNames = merge(settings.artifacts.default, settings.artifacts[realm])
    let WitnetPriceRouter = artifacts.require(artifactNames.WitnetPriceRouter)
    registry = await WitnetPriceRouter.at(witnetAddresses.WitnetPriceRouter);
  }

  if (!addresses[realm]) addresses[realm] = {}
  if (!addresses[realm][network]) addresses[realm][network] = {}

  examples = Object.keys(witnetRequests)
  for (let i = 0; i < examples.length; i ++) {
    let exampleName = examples[i]
    let example = witnetRequests[exampleName]
    PricePoller.contractName = exampleName + "Poller"
    if (addresses[realm][network][PricePoller.contractName] !== undefined) {
      let address = addresses[realm][network][PricePoller.contractName]
      // Deploy new contract if it still has no corresponding entry in the 'migrations/addresses.json' file:
      if (utils.isNullAddress(address)) {
        if (!example.decimals) {
          console.error(`Error: no decimals specified for '${exampleName}' in 'migrations/witnet.requests.json'`)
          continue
        }
        if (!example.base) {
          console.error(`Error: no base specified for '${exampleName}' in 'migrations/witnet.requests.json'`)
          continue
        }
        if (!example.quote) {
          console.error(`Error: no quote specified for '${exampleName}' in 'migrations/addresses.json'`)
          continue
        }        
        await deployer.deploy(
          PricePoller,
          witnetAddresses.WitnetRequestBoard,
          example.bytecode
        )

        console.log("   > Artifact name:\t  \"#artifact\"")
        console.log("   > Contract name:\t  \"" + PricePoller.contractName + "\"")
        
        // Write new contract address into 'migrations/addresses.json'
        addresses[realm][network][PricePoller.contractName] = PricePoller.address
        fs.writeFileSync("./migrations/addresses.json", JSON.stringify(addresses, null, 4), { flag: 'w+'})
      } 

      // Otherwise, just update the local artifact file:
      else {        
        PricePoller.address = address
        const header = `Skipped '${PricePoller.contractName}'`
        console.log("\n  ", header)
        console.log("  ", "-".repeat(header.length))
        console.log("   > contract address:\t", address)
      }
      
      // Update Price Registry if necessary:
      if (updateRegistry) {      
        const caption = "Price-" + example.base + "/" + example.quote + "-" + example.decimals
        const erc2362id = await registry.hashPriceCaption.call(caption)
        console.log("\n   > ERC2362 caption:\t ", caption)
        console.log("   > ERC2362 id:     \t ", erc2362id)
        console.log("   > Registry address:\t ", registry.address)
        let currentPoller = await registry.getPricePoller(erc2362id)
        if (utils.isNullAddress(currentPoller) || currentPoller !== PricePoller.address) {
          let answer = (await utils.prompt(`     ? Substitute current poller at ${currentPoller}? [y/N] `)).toLowerCase().trim()
          if (["y", "yes"].includes(answer)) {
            await registry.setPricePoller(
              PricePoller.address,
              example.decimals,
              example.base,
              example.quote
            )
            console.log("     > Done.")
          }
        }
      }

      // Trace Witnet general info
      let contract = await PricePoller.at(PricePoller.address)      
      console.log("\n   > Witnet address:\t ", await contract.witnet.call())
      console.log("   > Witnet Request hash:", await contract.hash.call())
    }
  }
  console.log()
}

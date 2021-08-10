const realm = process.env.WITNET_EVM_REALM ? process.env.WITNET_EVM_REALM.toLowerCase() : "default"
const addresses = require("../addresses")[realm]
const settings = require("../settings")

const ERC2362PriceFeed = artifacts.require(settings.artifacts[realm].ERC2362PriceFeed || settings.artifacts.default.ERC2362PriceFeed)
const CBOR = artifacts.require("CBOR")
const Witnet = artifacts.require("Witnet")
const WitnetProxy = artifacts.require("WitnetProxy")

module.exports = async function (deployer, network) {
  network = network.split("-")[0]
  if (network !== "test") {
    console.error(`
Please, migrate examples by using the package manager:

  $ npm run migrate-flattened <PriceFeedExample> <network>  

To list available data feed examples:

  $ npm run avail:examples

Harness the power of the Witnet Decentralized Oracle Network ;-)
    `)
    process.exit(1)
  }  
  else if (!addresses) {
    console.error(`There are no Witnet addresses set for realm '${realm}'.\n`)
    process.exit(1)
  }
  console.log(`\nSmoke testing migration of '${ERC2362PriceFeed.contractName}' contract...`)
  await deployer.deploy(CBOR)
  await deployer.link(CBOR, [Witnet])
  await deployer.deploy(Witnet)
  await deployer.link(Witnet, [ERC2362PriceFeed])
  await deployer.deploy(WitnetProxy)
  let pf = await deployer.deploy(
      ERC2362PriceFeed,      
      WitnetProxy.address,
      "ERC2362ID",
      ...(
        settings.constructorParams[realm].ERC2362PriceFeed
          || settings.constructorParams.default.ERC2362PriceFeed
      )
    )
  await pf.setWitnetScriptBytecode("0x80")
  console.log("Done.\n")
}

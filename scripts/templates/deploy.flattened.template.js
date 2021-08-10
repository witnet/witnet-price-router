const realm = process.env.WITNET_EVM_REALM.toLowerCase() || "default"
const addresses = require("../../migrations/addresses")[realm]
const settings = require("../../migrations/settings")
const radon = require("../../migrations/radons")["#example"]

const ERC2362PriceFeed = artifacts.require(
    settings.artifacts[realm].ERC2362PriceFeed || settings.artifacts.default.ERC2362PriceFeed
  )
const Witnet = artifacts.require("Witnet")
const WitnetRequestBoard = artifacts.require("WitnetRequestBoardInterface")

module.exports = async function (deployer, network, _accounts) {
  network = network.split("-")[0]
  if (network in addresses) {

    Witnet.address = addresses[network]["Witnet"]
    WitnetRequestBoard.address = addresses[network]["WitnetProxy"]
    ERC2362PriceFeed.contractName = "#example"    

    await deployer.link(Witnet, ERC2362PriceFeed)
    const dataFeedContract = await deployer.deploy(
        ERC2362PriceFeed,
        WitnetRequestBoard.address,
        radon.ERC2362ID,
        ...(
          settings.constructorParams[realm].ERC2362PriceFeed
          || settings.constructorParams.default.ERC2362PriceFeed
        )
      )
    await dataFeedContract.setWitnetScriptBytecode(radon.bytecode)

    console.log("   > Artifact name:\t  \"" + 
        (settings.artifacts[realm].ERC2362PriceFeed || settings.artifacts.default.ERC2362PriceFeed)
        + "\""
      )
    console.log("   > Contract name:\t  \"" + ERC2362PriceFeed.contractName + "\"")
    console.log("   > ERC2362ID:\t\t  \"" + radon.ERC2362ID + "\"")
    console.log("   > Witnet address:\t ", WitnetRequestBoard.address)
    console.log("   > Radon address:\t ", await dataFeedContract.radonScript.call())
    console.log("   > Radon script:\t ", radon.bytecode)    
    console.log()
  } else {
    console.error("Fatal: Witnet addresses were not provided!")
    process.exit(1)
  } 
}

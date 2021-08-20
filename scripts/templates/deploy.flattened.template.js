const realm = process.env.WITNET_EVM_REALM.toLowerCase() || "default"
const erc2362Settings = require("../../migrations/settings")
const witnetRequests = require("../../migrations/witnet.requests")["#example"]

const ERC2362PriceFeed = artifacts.require(
    erc2362Settings.artifacts[realm].ERC2362PriceFeed
      || erc2362Settings.artifacts.default.ERC2362PriceFeed
  )

module.exports = async function (deployer, network, _accounts) {
  let witnetAddresses
  try {
    witnetAddresses = require("../../migrations/witnet.addresses")[realm][network.split("-")[0]]
    // let erc2362Addresses = require("../../migrations/addresses")[realm][network]
  } catch {
    console.error("Fatal: Witnet addresses were not provided!")
    process.exit(1)
  }

  ERC2362PriceFeed.contractName = "#example" + "Feed"
  let decimals = witnetRequests.decimals || 3
  let erc2362id = witnetRequests.ERC2362ID ||
    ("#example".endsWith("Price")
      ? `Price-${
          "#example"
            .replace("Price", "")
            .split(/(?=[A-Z])/)
            .map(s => s.toUpperCase())
            .join("/")
        }-${decimals}`
      : "#example"
    )

  await deployer.deploy(
      ERC2362PriceFeed,
      witnetAddresses.WitnetRequestBoard,
      erc2362id,
      decimals,
      ...(
        erc2362Settings.constructorParams[realm].ERC2362PriceFeed
          || erc2362Settings.constructorParams.default.ERC2362PriceFeed
      )
    )
  let priceFeed = await ERC2362PriceFeed.at(ERC2362PriceFeed.address)
  await priceFeed.initialize(witnetRequests.bytecode)

  console.log("   > Artifact name:\t  \"" + 
      (
        erc2362Settings.artifacts[realm].ERC2362PriceFeed
          || erc2362Settings.artifacts.default.ERC2362PriceFeed
      )
      + "\""
    )
  console.log("   > Contract name:\t  \"" + ERC2362PriceFeed.contractName + "\"")
  console.log("   > ERC2362 ID:\t  \"" + await priceFeed.erc2362ID.call() + "\"")
  console.log("   > ERC2362 literal:\t  \"" + await priceFeed.literal.call() + "\"")
  console.log("   > WRB address:\t ", await priceFeed.witnet.call())
  console.log("   > Bytecode:\t\t ", await priceFeed.bytecode())  
  console.log()
}

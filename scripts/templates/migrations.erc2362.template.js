const fs = require("fs")

const erc2362Addresses = require("../../migrations/erc2362.addresses")
const erc2362Settings = require("../../migrations/erc2362.settings")
const witnetRequests = require("../../migrations/witnet.requests")
const ERC2362PriceFeed = artifacts.require("#artifact")

module.exports = async function (deployer, network, _accounts) {
  const realm = process.env.WITNET_EVM_REALM.toLowerCase() || "default"
  network = network.split("-")[0]
  let witnetAddresses
  try {    
    witnetAddresses = require("../../migrations/witnet.addresses")[realm][network]
  } catch {
    console.error("Fatal: Witnet addresses were not provided!")
    process.exit(1)
  }

  if (!erc2362Addresses[realm]) erc2362Addresses[realm] = {}
  if (!erc2362Addresses[realm][network]) erc2362Addresses[realm][network] = {}

  examples = Object.keys(witnetRequests)
  for (let i = 0; i < examples.length; i ++) {
    let exampleName = examples[i]
    let example = witnetRequests[exampleName]
    ERC2362PriceFeed.contractName = exampleName + "Feed"
    let address = erc2362Addresses[realm][network][ERC2362PriceFeed.contractName]
    if (isNullAddress(address)) {
      // Deploy this price feed example if it has no entry in the 'migrations/addresses.json' file:
      let decimals = example.decimals || 3
      let erc2362id = example.ERC2362ID
      if (!example.ERC2362ID) {
        erc2362id = exampleName.endsWith("Price")
          ? `Price-${
              exampleName
                .replace("Price", "")
                .split(/(?=[A-Z])/)
                .map(s => s.toUpperCase())
                .join("/")
            }-${decimals}`
          : exampleName
        witnetRequests[exampleName].ERC2362ID = erc2362id
      }

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
      let priceFeedContract = await ERC2362PriceFeed.at(ERC2362PriceFeed.address)
      await priceFeedContract.initialize(example.bytecode)

      console.log("   > Artifact name:\t  \"#artifact\"")
      console.log("   > Contract name:\t  \"" + ERC2362PriceFeed.contractName + "\"")
      console.log("   > ERC2362 ID:\t  \"" + await priceFeedContract.erc2362ID.call() + "\"")
      console.log("   > ERC2362 literal:\t  \"" + await priceFeedContract.literal.call() + "\"")
      console.log("   > WRB address:\t ", await priceFeedContract.witnet.call())
      console.log("   > Bytecode:\t\t ", await priceFeedContract.bytecode.call())  

      erc2362Addresses[realm][network][ERC2362PriceFeed.contractName] = ERC2362PriceFeed.address
    } else {
      // Otherwise, just update the local artifact file corresponding to this price feed example:
      ERC2362PriceFeed.address = address
      console.log(`\n   Skipped: Presumably, '${ERC2362PriceFeed.contractName}' deployed at '${address}'.`)
    }
  }
  console.log()
  // Write to file current status of ERC2362 Price Feed Contract addresses, and Witnet Request ERC2362IDs
  // just in case a new one was deployed during this sprint:
  fs.writeFileSync("./migrations/erc2362.addresses.json", JSON.stringify(erc2362Addresses, null, 4), { flag: 'w+'})
  fs.writeFileSync("./migrations/witnet.requests.json", JSON.stringify(witnetRequests, null, 4), { flag: 'w+'})
}

function isNullAddress (addr) {
  return !addr ||
      addr === "undefined" ||
      addr === "0x0000000000000000000000000000000000000000" ||
      !web3.utils.isAddress(addr)
}


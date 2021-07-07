const Witnet = artifacts.require("Witnet")
const WitnetRequestBoardProxy = artifacts.require("WitnetRequestBoardProxy")
const #artifact = artifacts.require("#artifact")

const addresses = {
  // Template: same content at migrations/2_witnet_core.js
  //           must be copied here
}

module.exports = async function (deployer, network, accounts) {
  network = network.split("-")[0]
  if (network in addresses) {
    Witnet.address = addresses[network]["Witnet"]
    WitnetRequestBoardProxy.address = addresses[network]["WitnetRequestBoardProxy"]
    await deployer.link(Witnet, [#artifact])
    await deployer.deploy(#artifact, WitnetRequestBoardProxy.address)
  } else {
    console.log("Fatal: Witnet addresses were not provided!")
    process.exit(1)
  }  
}

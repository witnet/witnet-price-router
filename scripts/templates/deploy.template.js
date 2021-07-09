const Witnet = artifacts.require("Witnet")
const WitnetRequestBoardProxy = artifacts.require("WitnetRequestBoardProxy")
const #artifact = artifacts.require("#artifact")

const addresses = {
  // Template: same content at migrations/2_witnet_core.js
  //           must be copied here
  "goerli": {
    "CBOR": "0x9905821089928e5A26841225510cea8B2984F6D8",
    "Witnet": "0x9b42b0D80C428B17A5828dF5C2c96454ca54bD04",
    "WitnetRequestBoardProxy": "0x0C4be6AA667df48de54BA174bE7948875fdf152B",
  },
  "rinkeby": {
    "CBOR": "0xa3AFD68122a21c7D21Ddd95E5c077f958dA46662",
    "Witnet": "0x5259aCEfF613b37aF35999798A6da60bEF326038",
    "WitnetRequestBoardProxy": "0x9b42b0D80C428B17A5828dF5C2c96454ca54bD04",
  },
  "kovan": {
    "CBOR": "0xB4B2E2e00e9d6E5490d55623E4F403EC84c6D33f",
    "Witnet": "0xD9465D38f50f364b3263Cb219e58d4dB2D584530",
    "WitnetRequestBoardProxy": "0xD9a6d1Ea0d0f4795985725C7Bd40C31a667c033d",
  },
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

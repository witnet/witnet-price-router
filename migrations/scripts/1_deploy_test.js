const prompt = require("prompt-sync")({ sigint: true })
const settings = require("../erc2362.settings")

module.exports = async function (_deployer, network) {
  network = network.split("-")[0]
  const rn = require("../../scripts/utils").getRealmNetworkFromNetwork(network)
  const realm = rn[0]; network = rn[1]
  if (network.split(".")[1] !== "test") {
    console.error(`
Please, migrate examples by using the package manager:

  $ npm run migrate <Realm.Network>

To list available data feed examples:

  $ npm run avail:examples

Enjoy the power of the Witnet Decentralized Oracle Network ;-)
    `)
    process.exit(1)
  }
  else {
    if (realm !== "default") {
      if (
        !settings.networks[realm] ||
        !settings.networks[realm].test ||
        !settings.networks[realm].test.network_id ||
        settings.networks[realm].test.network_id == 4447 
      ) {
        console.error(`\nFatal: no "test" configuration found for ${realm.toUpperCase()} realm! Please, review 'migrations/erc2362.settings.js'.`)
        process.exit(1)
      }
      let answer = prompt(`> Do you really want to run tests against ${realm.toUpperCase()} realm? [y/N] `).toLowerCase().trim()
      if (!["y", "yes"].includes(answer)) {
        console.log("\nInfo: cancelled by user.")
        process.exit(0)
      } else {
        console.log("> As you wish. Please, be patient...")
      }
    }
  }
}

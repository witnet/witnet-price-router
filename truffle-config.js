// In order to load environment variables (e.g. API keys)
require("dotenv").config()
const { merge } = require("lodash")
const settings = require("./migrations/settings")
const rn = require("./scripts/utils").getRealmNetworkFromArgs()
const realm = rn[0]; const network = rn[1]

if (!settings.networks[realm] || !settings.networks[realm][network]) {
  if (network !== "development" && network !== "test") {
    console.error(
      `Fatal: network "${realm}:${network}"`,
      "configuration not found in \"./migrations/settings.js#networks\""
    )
    process.exit(1)
  }
}
console.info(`
Targetting "${realm.toUpperCase()}" realm
===================${"=".repeat(realm.length)}`
)

module.exports = {
  build_directory: `./build/${realm}/`,
  contracts_directory: "./contracts/",
  migrations_directory: "./migrations/scripts/",
  networks: settings.networks[realm],
  compilers: merge(settings.compilers.default, settings.compilers[realm]),
  mocha: {
    reporter: "eth-gas-reporter",
    reporterOptions: {
      coinmarketcap: process.env.COINMARKETCAP_API_KEY,
      currency: "USD",
      gasPrice: 100,
      src: "contracts",
    },
    timeout: 100000,
    useColors: true,
  },
}

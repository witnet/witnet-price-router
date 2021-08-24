// In order to load environment variables (e.g. API keys)
require("dotenv").config()
const { merge } = require("lodash")
const settings = require("./migrations/erc2362.settings")

module.exports = {
  build_directory: `./build/default/`,
  contracts_directory: "./contracts/",
  migrations_directory: "./migrations/scripts/",
  networks: settings.networks.default,
  compilers: settings.compilers.default,
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

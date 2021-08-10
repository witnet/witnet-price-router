// In order to load environment variables (e.g. API keys)
require("dotenv").config()

const statics = require("./migrations/settings")
const realm = process.env.WITNET_EVM_REALM ? process.env.WITNET_EVM_REALM.toLowerCase() : "default"

module.exports = {
  build_directory: "./build/" + realm + "/",
  migrations_directory: "./migrations/scripts/",
  networks: statics.networks[realm],
  mocha: {
    reporter: "eth-gas-reporter",
    reporterOptions: {
      coinmarketcap: process.env.COINMARKETCAP_API_KEY,
      currency: "USD",
      gasPrice: 100,
      excludeContracts: ["Migrations"],
      src: "contracts",
    },
    timeout: 100000,
    useColors: true,
  },
  compilers: {
    solc: {
      version: statics.compilers[realm].version || statics.compilers.default.version,
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
      evmVersion: statics.compilers[realm].evmVersion || statics.compilers.default.evmVersion,
    },
  },

  // This plugin allows to verify the source code of your contracts on Etherscan with this command:
  // ETHERSCAN_API_KEY=<your_etherscan_api_key> truffle run verify <contract_name> --network <network_name>
  plugins: [
    "truffle-plugin-verify",
  ],

  // This is just for the `truffle-plugin-verify` to catch the API key
  api_keys: {
    etherscan: process.env.ETHERSCAN_API_KEY,
  },
}

// In order to load environment variables (e.g. API keys)
require("dotenv").config()
const { merge } = require("lodash")
const settings = require("./migrations/erc2362.settings")
const realm = process.env.WITNET_EVM_REALM ? process.env.WITNET_EVM_REALM.toLowerCase() : "default"

module.exports = {
  build_directory: `./build/${realm}/`,
  contracts_directory: process.env.FLATTENED_DIRECTORY,
  migrations_directory: process.env.FLATTENED_DIRECTORY,
  networks: settings.networks[realm],
  compilers: merge(settings.compilers.default, settings.compilers[realm]),
}

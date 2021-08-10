// In order to load environment variables (e.g. API keys)
require("dotenv").config()
const baseConfig = require("./truffle-config")
module.exports = {
  build_directory: baseConfig.build_directory,
  contracts_directory: process.env.FLATTENED_DIRECTORY,
  migrations_directory: process.env.FLATTENED_DIRECTORY,
  networks: baseConfig.networks,
  compilers: baseConfig.compilers,
}

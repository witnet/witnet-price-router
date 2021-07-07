const exec = require("child_process").execSync
const os = require("os")
const fs = require("fs")

switch (os.type()) {
  case "Windows_NT":
    if (!fs.existsSync(".\\build\\contracts\\")) {
      exec("mkdir build\\contracts\\")
    }
    exec("copy node_modules\\witnet-ethereum-bridge\\build\\contracts\\*.json build\\contracts")
    break
  default:
    exec("mkdir -p build/contracts/./ && cp node_modules/witnet-ethereum-bridge/build/contracts/*.json build/contracts")
}

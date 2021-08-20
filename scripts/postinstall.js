const exec = require("child_process").execSync
const os = require("os")
const fs = require("fs")

switch (os.type()) {
  case "Windows_NT":
    exec("copy node_modules\\witnet-ethereum-bridge\\migrations\\witnet.addresses.json migrations\\")
    if (!fs.existsSync("contracts/requests")) {
      exec("mkdir contracts\\requests")
    }
    break
  default:
    exec("cp node_modules/witnet-ethereum-bridge/migrations/witnet.addresses.json migrations/")
    if (!fs.existsSync("contracts/requests")) {
      exec("mkdir contracts/requests")
    }
}

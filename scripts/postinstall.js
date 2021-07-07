var exec = require('child_process').exec;
var os = require('os');

switch (os.type()) {
  case "Windows_NT":
    exec("mkdir build\\contracts\\ && copy node_modules\\witnet-ethereum-bridge\\build\\contracts\\*.json build\\contracts")
    break;
  default:
    exec("mkdir -p build/contracts/./ && cp node_modules/witnet-ethereum-bridge/build/contracts/*.json build/contracts")
}
const exec = require('child_process').exec;
const os = require('os');
const path = require('path')
const fs = require('fs')

if (process.argv.length < 3) {
  console.log("Usage: node flatten.js /path/to/base/solidity/file")
  process.exit(1)
}

const target = process.argv[2]
const basename = path.basename(target)

switch (os.type()) {
  case "Windows_NT":
    if (!fs.existsSync(".\\contracts\\flattened\\")) {
      exec("mkdir contracts\\flattened\\")
    }
    exec(`npx truffle-flattener ${target} > .\\contracts\\flattened\\Flattened${basename}`)
    break;
  default:
    exec(`mkdir -p contracts/flattened/ 2>/dev/null; npx truffle-flattener ${target} > contracts/flattened/Flattened${basename}.sol`)
}

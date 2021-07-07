const exec = require('child_process').exec
const path = require('path')
const fs = require('fs')

if (process.argv.length < 3) {
  console.log("Usage: node flatten.js /path/to/solidity/files/")
  process.exit(1)
}

const dirname = path.dirname(process.argv[2])

if (!fs.existsSync(".\\contracts\\flattened\\")) {
  exec("mkdir contracts\\flattened\\")
}

const files = fs.readdirSync(dirname).filter(filename => filename.endsWith(".sol"))
files.forEach(filename => {
  const target = dirname + "\\" + filename
  console.log(`Flattening ${target}...`)
  exec(`npx truffle-flattener ${target} > .\\contracts\\flattened\\Flattened${filename}`)
})

console.log(`Flattened ${files.length} Solidity files.`)

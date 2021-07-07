/* eslint-disable camelcase */
/* eslint-disable new-cap */

const exec = require("child_process").exec
const fs = require("fs")
const os = require("os")
const cli = new cli_func()

require("dotenv").config()

if (process.argv.length < 4) {
  console.log()
  console.log("Usage: npm|yarn verify:flattened <ArtifactName> <Network>")
  console.log()
  process.exit(0)
}

const artifact = process.argv[2]
const network = process.argv[3]
process.env.FLATTENED_DIRECTORY = `./contracts/flattened/${artifact}/`

if (!fs.existsSync(`${process.env.FLATTENED_DIRECTORY}/Flattened${artifact}.sol`)) {
  console.log()
  console.log("> Please, flatten the artifact first. E.g.:")
  console.log(`  $ yarn flatten contracts${os.type() === "Windows_NT" ? "\\" : "/"}${artifact}.sol`)
  console.log()
  process.exit(0)
}

verifyFlattened(artifact, network).catch(err => {
  console.log("Fatal:", err)
  console.log()
  console.log("> Please, make sure you run migrate:flattened the artifact first. E.g.:")
  console.log(`  $ yarn migrate:flatten ${artifact} ${network}`)
  console.log()
  process.exit(1)
})

/// ////////////////////////////////////////////////////////////////////////////

function cli_func () {
  this.exec = async function (cmd) {
    return new Promise((resolve, reject) => {
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          reject(error)
          return
        }
        resolve(stdout)
      }).stdout.pipe(process.stdout)
    })
  }
}

async function verifyFlattened (artifact, network) {
  console.log(`> Verifying from ${process.env.FLATTENED_DIRECTORY} into network '${network}'...`)
  await cli.exec(`truffle run verify --config flattened-config.js ${process.argv[2]} --network ${network}`)
}

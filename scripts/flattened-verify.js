/* eslint-disable camelcase */
/* eslint-disable new-cap */
/* eslint-disable no-multi-str */
/* eslint-disable no-template-curly-in-string */

const exec = require("child_process").exec
const fs = require("fs")
const cli = new cli_func()

require("dotenv").config()

if (process.argv.length < 4) {
  console.log("\n\
    Usage: yarn verify:flattened <ArtifactName> <Network>\n\
       or: npm run verify:flattened <ArtifactName> <Network>\n\n\
  ")
  process.exit(0)
}

const artifact = process.argv[2]
const network = process.argv[3]
process.env.FLATTENED_DIRECTORY = `./contracts/flattened/${artifact}/`

if (!fs.existsSync(`${process.env.FLATTENED_DIRECTORY}/Flattened${artifact}.sol`)) {
  console.error("\n\
    > Please, flatten the artifact first. E.g.:\n\
      $ yarn flatten contracts${os.type() === \"Windows_NT\" ? \"\\\\\" : \"/\"}${artifact}.sol\n\n\
  ")
  process.exit(1)
}

verifyFlattened(artifact, network).catch(err => {
  console.error("Fatal:", err)
  console.error("\n\
    > Please, make sure you run migrate:flattened the artifact first. E.g.:\n\
      $ yarn migrate:flattened ${artifact} ${network}\n\n\
  ")
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
  await cli.exec(`truffle run verify --config flattened-config.js ${artifact} --network ${network}`)
}

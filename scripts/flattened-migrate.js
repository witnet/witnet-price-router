/* eslint-disable camelcase */
/* eslint-disable new-cap */
/* eslint-disable no-multi-str */
/* eslint-disable no-template-curly-in-string */

require("dotenv").config()

const exec = require("child_process").exec
const fs = require("fs")
const os = require("os")
const cli = new cli_func()

const realm = process.env.WITNET_EVM_REALM.toLowerCase() || "default"
const settings = require("../migrations/settings")

const radons = require("../migrations/witnet.requests")

if (process.argv.length < 4) {
  console.log()
  console.log("\n\
    Usage: yarn migrate:flattened <Network> <PriceFeedExample>\n\
       or: npm run migrate:flattened <Network> <PriceFeedExample>\n\n\
  ")
  process.exit(0)
}

const artifact = settings.artifacts[realm].ERC2362PriceFeed || settings.artifacts.default.ERC2362PriceFeed
const network = process.argv[2]
const pricefeed = process.argv[3]
process.env.FLATTENED_DIRECTORY = `./flattened/${artifact}/`

if (!radons[pricefeed]) {
  console.error("\n!!! Data feed example not found in 'migrations/radons.js'\n")
  console.error("> To list available data feed examples, please use:\n")
  console.error("  $ npm run avail:examples\n")
  process.exit(0)
}

if (!settings.networks[realm][network]) {
  console.error("\n!!! Network configuration not found in 'migrations/settings.js'\n")
  console.error("> To list available networks, please use:\n")
  console.error("  $ npm run avail:networks\n")
  process.exit(0)
}

if (!fs.existsSync(`${process.env.FLATTENED_DIRECTORY}/Flattened${artifact}.sol`)) {
  console.log("\n> Please, flatten artifacts first:\n")
  console.log("  $ npm run flatten\n")
  process.exit(0)
}

compileFlattened().then(() => {
  console.log()
  composeMigrationScript(pricefeed)
  migrateFlattened(network).then(() => {
    deleteMigrationScript()
    console.log()
  })
})
  .catch(err => {
    console.error("Fatal:", err)
    console.error()
    process.exit(-1)
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

async function migrateFlattened (network) {
  console.log(`> Migrating from ${process.env.FLATTENED_DIRECTORY} into network '${network}'...`)
  await cli.exec(`truffle migrate --reset --config truffle-config.flattened.js --network ${network}`)
    .catch(err => {
      console.error(err)
      process.exit(-2)
    })
}

async function compileFlattened () {
  console.log(`> Compiling from ${process.env.FLATTENED_DIRECTORY}...`)
  await cli.exec("truffle compile --all --config truffle-config.flattened.js")
    .catch(err => {
      console.error(err)
      process.exit(-1)
    })
}

function composeMigrationScript (artifact) {
  let templateFile = "./scripts/templates/deploy.flattened.template.js"
  let migrationFile = `${process.env.FLATTENED_DIRECTORY}/1_deploy.js`
  if (os.type() === "Windows_NT") {
    templateFile = templateFile.replace(/\//g, "\\")
    migrationFile = migrationFile.replace(/\//g, "\\")
  }
  try {
    let script = fs.readFileSync(templateFile, "utf8")
    script = script.split("#example").join(pricefeed)
    console.log("Composed migration script:")
    console.log("=========================")
    console.log(script)
    fs.writeFileSync(migrationFile, script, { encoding: "utf8" })
  } catch (e) {
    console.error(e)
    console.error("\n\
      Fatal: unable to compose migration script into " + process.env.FLATTENED_DIRECTORY + "\n\n\
    ")
    process.exit(-4)
  }
}

function deleteMigrationScript () {
  let migrationFile = `${process.env.FLATTENED_DIRECTORY}/1_deploy.js`
  if (os.type() === "Windows_NT") {
    migrationFile = migrationFile.replace(/\//g, "\\")
  }
  if (fs.existsSync(migrationFile)) {
    try {
      fs.unlinkSync(migrationFile)
    } catch (e) {
      console.error(e)
      console.error("\n\
        Fatal: unable to delete " + migrationFile + "\n\n\
      ")
      process.exit(-1)
    }
  }
}

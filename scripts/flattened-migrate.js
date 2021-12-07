/* eslint-disable camelcase */
/* eslint-disable new-cap */
/* eslint-disable no-multi-str */
/* eslint-disable no-template-curly-in-string */

require("dotenv").config()

const exec = require("child_process").exec
const fs = require("fs")
const os = require("os")
const cli = new cli_func()

const settings = require("../migrations/settings")
const templateScript = "migrations.template.js"
const outputScript = "1_deploy.js"

if (process.argv.length < 3) {
  console.log()
  console.log("\n\
    Usage: npm run migrate <[Realm.]Network>\n\n\
  ")
  process.exit(0)
}

const rn = require("./utils").getRealmNetworkFromString(process.argv[2])
const realm = rn[0]; const network = rn[1]

if (!settings.networks[realm] || !settings.networks[realm][network]) {
  console.error(`\n!!! Network "${network}" not found.\n`)
  if (settings.networks[realm]) {
    console.error(`> Available networks in realm "${realm}":`)
    console.error(settings.networks[realm])
  } else {
    console.error("> Available networks:")
    console.error(settings.networks)
  }
  process.exit(1)
}

const artifact = settings.artifacts[realm]
  ? settings.artifacts[realm].WitnetPriceFeed
  : settings.artifacts.default.WitnetPriceFeed

process.env.FLATTENED_DIRECTORY = `./flattened/${artifact}/`

if (!fs.existsSync(`${process.env.FLATTENED_DIRECTORY}/Flattened${artifact}.sol`)) {
  console.log("\n> Please, flatten artifacts first:\n")
  console.log("  $ npm run flatten\n")
  process.exit(0)
}

composeMigrationScript(artifact)
migrateFlattened(network).then(() => {
  deleteMigrationScript()
  console.log()
})
.catch(err => {
  console.error("Fatal:", err)
  console.error()
  process.exit(-1)
})

/// /////////////////////////////////////////////////////////////////////////////

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
  await new Promise((resolve) => {
    const subprocess = require("child_process").spawn(
      "truffle",
      [
        "migrate",
        "--reset",
        "--config",
        "truffle-config.flattened.js",        
        "--network",
        network,
      ],
      {
        shell: true,
        stdin: "inherit",
      }
    )
    process.stdin.pipe(subprocess.stdin)
    subprocess.stdout.pipe(process.stdout)
    subprocess.stderr.pipe(process.stderr)
    subprocess.on("close", (code) => {
      if (code !== 0) {
        process.exit(code)
      }
      resolve(subprocess.stdout)
    })
  })
}

function composeMigrationScript (artifact) {
  let templateFile = `./scripts/templates/${templateScript}`
  let migrationFile = `${process.env.FLATTENED_DIRECTORY}/${outputScript}`
  if (os.type() === "Windows_NT") {
    templateFile = templateFile.replace(/\//g, "\\")
    migrationFile = migrationFile.replace(/\//g, "\\")
  }
  try {
    let script = fs.readFileSync(templateFile, "utf8")
    script = script.split("#artifact").join(artifact)
    console.log("Composed migration script:")
    console.log("=========================")
    console.log(script)
    fs.writeFileSync(migrationFile, script, { encoding: "utf8", flag: "w+" })
  } catch (e) {
    console.error(e)
    console.error("\n\
      Fatal: unable to compose migration script into " + process.env.FLATTENED_DIRECTORY + "\n\n\
    ")
    process.exit(-4)
  }
}

function deleteMigrationScript () {
  let migrationFile = `${process.env.FLATTENED_DIRECTORY}/${outputScript}`
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

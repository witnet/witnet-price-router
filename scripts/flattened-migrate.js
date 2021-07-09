/* eslint-disable camelcase */
/* eslint-disable new-cap */
/* eslint-disable no-multi-str */
/* eslint-disable no-template-curly-in-string */

const exec = require("child_process").exec
const fs = require("fs")
const os = require("os")
const cli = new cli_func()

if (process.argv.length < 4) {
  console.log()
  console.log("\n\
    Usage: yarn migrate:flattened <ArtifactName> <Network>\n\
       or: npm run migrate:flattened <ArtifactName> <Network>\n\n\
  ")
  process.exit(0)
}

const artifact = process.argv[2]
const network = process.argv[3]
process.env.FLATTENED_DIRECTORY = `./contracts/flattened/${artifact}/`

if (!fs.existsSync(`${process.env.FLATTENED_DIRECTORY}/Flattened${artifact}.sol`)) {
  console.log("\n\
    > Please, flatten the artifact first. E.g.:\n\
      $ yarn flatten contracts${os.type() === \"Windows_NT\" ? \"\\\\\" : \"/\"}${artifact}.sol\n\n\
  ")
  process.exit(0)
}

compileFlattened().then(() => {
  console.log()
  composeMigrationScript(artifact)
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
  await cli.exec(`truffle migrate --reset --config flattened-config.js --network ${network} --skip-dry-run`)
    .catch(err => {
      console.error(err)
      process.exit(-2)
    })
}

async function compileFlattened () {
  console.log(`> Compiling from ${process.env.FLATTENED_DIRECTORY}...`)
  await cli.exec("truffle compile --all --config flattened-config.js")
    .catch(err => {
      console.error(err)
      process.exit(-1)
    })
}

function composeMigrationScript (artifact) {
  let templateFile = "./scripts/templates/deploy.template.js"
  let migrationFile = `${process.env.FLATTENED_DIRECTORY}/1_deploy.js`
  if (os.type() === "Windows_NT") {
    templateFile = templateFile.replace(/\//g, "\\")
    migrationFile = migrationFile.replace(/\//g, "\\")
  }
  try {
    let script = fs.readFileSync(templateFile, "utf8")
    script = script.split("#artifact").join(artifact)
    console.log(script)
    fs.writeFileSync(migrationFile, script, { encoding: "utf8" })
  } catch (e) {
    console.error(e)
    console.error("\n\
      Fatal: unable to compose migration script into ${process.env.FLATTENED_DIRECTORY}\n\n\
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
        Fatal: unable to delete ${migrationFile}\n\n\
      ")
      process.exit(-1)
    }
  }
}

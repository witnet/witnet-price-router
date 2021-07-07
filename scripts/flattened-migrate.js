/* eslint-disable camelcase */
/* eslint-disable new-cap */

const exec = require("child_process").exec
const fs = require("fs")
const os = require("os")
const cli = new cli_func()

if (process.argv.length < 4) {
  console.log()
  console.log("Usage: npm|yarn migrate:flattened <ArtifactName> <Network>")
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

compileFlattened(artifact).then(() => {
  console.log()
  composeMigrationScript(artifact)
  migrateFlattened(artifact, network).then(() => {
    deleteMigrationScript(artifact)
    console.log()
  })
})
  .catch(err => {
    console.log("Fatal:", err)
    console.log()
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

async function migrateFlattened (artifact, network) {
  console.log(`> Migrating from ${process.env.FLATTENED_DIRECTORY} into network '${network}'...`)
  await cli.exec(`truffle migrate --reset --config flattened-config.js --network ${network} --skip-dry-run`)
    .catch(err => {
      console.log(err)
      process.exit(-2)
    })
}

async function compileFlattened (artifact) {
  console.log(`> Compiling from ${process.env.FLATTENED_DIRECTORY}...`)
  await cli.exec("truffle compile --all --config flattened-config.js")
    .catch(err => {
      console.log(err)
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
    console.log(e)
    console.log()
    console.log(`Fatal: unable to compose migration script into ${process.env.FLATTENED_DIRECTORY}`)
    process.exit(-4)
  }
}

function deleteMigrationScript (artifact) {
  let migrationFile = `${process.env.FLATTENED_DIRECTORY}/1_deploy.js`
  if (os.type() === "Windows_NT") {
    migrationFile = migrationFile.replace(/\//g, "\\")
  }
  if (fs.existsSync(migrationFile)) {
    try {
      fs.unlinkSync(migrationFile)
    } catch (e) {
      console.log(e)
      console.log()
      console.log(`Fatal: unable to delete ${migrationFile}`)
      process.exit(-1)
    }
  }
}

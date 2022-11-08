
const addresses = require("../migrations/addresses")
const exec = require("child_process").execSync
const fs = require("fs")
const queries = require("../migrations/witnet-queries")
const captions = Object.keys(queries)

exec("pwd")

if (process.argv.length >= 3) {
  let networks = require("../migrations/settings").networks
  let realm; const network = process.argv[2].toLowerCase()
  realm = network.split(".")[0].toLowerCase()
  if (realm === "ethereum") realm = "default"
  if (!networks[realm]) {
    console.log("Unknown realm:", realm)
    process.exit(1)
  }
  if (network.split(".")[1]) {
    if (!networks[realm][network]) {
      console.log("Realm:", realm)
      console.log("Unknown network:", network)
      process.exit(1)
    }
    networks = networks[realm][network]
  } else {
    console.log("Network was not specified!")
    process.exit(1)
  }
  console.log(`Feeds on ${network}:`)
  console.log("\t\t\t\tAddress\t\t\t\t\t\tDry-run")
  const output = []
  captions.forEach(async key => {
    const feed = key + "Feed"
    const addr = addresses[realm][network][feed]
    if (addr && queries[key]?.bytecode) {
      const dryrun = exec(
        `npx witnet-toolkit try-query --hex ${
          queries[key]?.bytecode
        } | tail -n 2 | head -n 1 | awk -F: '{ print $2 }' | sed 's/ //g' | tr -d \"│\"`
      ).toString().split("\n")[0]
      console.log(`${feed}${feed.length > 15 ? "\t\t" : "\t\t\t"}${addr}\t${dryrun}`)
      output.push({ feed, addr, dryrun })
    }
  })
  fs.writeFile(`.out\\${network}.dryruns.out`, JSON.stringify(output), function (err) {
    if (err) {
      console.log(err)
    }
  })
  console.log()
} else {
  console.log("Data feeds ready for deployment:\n")
  captions.forEach(key => {
    console.log(`  ${key}`, !queries[key]?.bytecode ? "(routed)" : "")
  })
  console.log()
}

const cbor = require("cbor")
const exec = require("child_process").execSync
const { merge } = require("lodash")

const addresses = require("../addresses")
const queries = require("../witnet-queries")
const settings = require("../settings")
const utils = require("../../scripts/utils")

const WitnetRequestBoard = artifacts.require("WitnetRequestBoard")

module.exports = async function (deployer, network, [, from]) {

  const [realm, chain] = utils.getRealmNetworkFromString(network.split("-")[0])

  const artifactNames = merge(
    settings.artifacts.default,
    settings.artifacts[realm]
  )
  const WitnetPriceFeed = artifacts.require(artifactNames.WitnetPriceFeed)
  
  let witnetAddresses
  try {
    witnetAddresses = require("witnet-solidity-bridge/migrations/witnet.addresses")[realm][chain]
  } catch (e) {
    console.error(`Fatal: Witnet addresses not available for ${chain}`, e)
    process.exit(1)
  }
  const wrb = await WitnetRequestBoard.at(witnetAddresses.WitnetRequestBoard)

  console.log(`Unrouted feeds on ${chain}:\n`) 
  console.log("\t\t\t\tAddress\t\t\t\t\t\tQuery\tPending\tDry-run")
  const batch = []
  await Promise.all(Object.keys(queries).map(async key => {
    const feed = key + "Feed"
    const addr = addresses[realm][chain][feed]
    if (addr && queries[key]?.bytecode) {
      const contract = await WitnetPriceFeed.at(addr)        
      const queryId = await contract.latestQueryId.call()
      const pending = await contract.pendingUpdate.call()
      const dryrun = exec(`npx witnet-toolkit try-query --hex ${queries[key]?.bytecode} | tail -n 2 | head -n 1 | awk -F: '{ print $2 }' | sed 's/ //g' | tr -d \"│\"`).toString().split('\n')[0]
      process.stdout.write(`${feed}${feed.length > 15 ? "\t\t" : "\t\t\t"}${addr}\t`)
      process.stdout.write(`${queryId}\t${pending}\t`)
      process.stdout.write(`${dryrun}\n`)
      if (pending) {
        batch.push([
          parseInt(queryId), 
          Math.floor(Date.now() / 1000) - 90,
          "0xfefefefefefefefefefefefefefefefefefefefefefefefefefefefefefefefe",
          "0x" + cbor.encode(parseInt(dryrun)).toString('hex')
        ])
      }
    }
  }))
  if (batch.length > 0) {
    let answer = (await utils.prompt(`\nForcely update pending feeds (${batch.length})? [y/N] `)).toLowerCase().trim()
    if (["y", "yes"].includes(answer)) {
      const tx = await wrb.reportResultBatch(batch, true, { gas: 4000000, from })
      console.log()
      tx.logs.map(log => console.log(`  => ${log.event}(${log.args[0].toString()}, ${log.args[1]})`))
    }
  }
  console.log()
}
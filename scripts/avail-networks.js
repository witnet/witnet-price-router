require("dotenv").config()

const realm = process.env.WITNET_EVM_REALM.toLowerCase() || "default"
const settings = require("../migrations/settings")

const networks = Object.keys(settings.networks[realm])
console.log(`\nAvailable networks within realm ${realm.toUpperCase()}:\n`)
networks.forEach(network => console.log(`  ${network}`))
console.log()

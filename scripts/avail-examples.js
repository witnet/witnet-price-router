const radons = require("../migrations/witnet.requests")
const datafeeds = Object.keys(radons)
console.log("Available data feed examples ready for deployment:\n")
datafeeds.forEach(datafeed => console.log(`  ${datafeed}`))
console.log()

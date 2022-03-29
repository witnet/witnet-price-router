import * as Witnet from "witnet-requests"

// Retrieve VSQ/DAI-6 price from the SushiSwap DEX API:
const sushiswap = new Witnet.Source("https://data.witnet.io/?endpoint=https://api.thegraph.com/subgraphs/name/sushiswap/matic-exchange&data=%7B%22query%22%3A%22%7B%5Cn%20%20pair(id%3A%20%5C%220x102d39bc293472dc9ac3e6a0a9261a838b3bc6d7%5C%22)%20%7B%5Cn%20%20%20%20token0Price%5Cn%20%20%7D%5Cn%7D%22%2C%22variables%22%3A%7B%7D%7D")
  .parseJSONMap()
  .getMap("pair")
  .getFloat("token0Price") // Get the `Float` value associated to the `price` key
  .multiply(10 ** 6) // Use 6 digit precision
  .round() // Cast to integer

// Filters out any value that is more than 1.5 times the standard
// deviationaway from the average, then computes the average mean of the
// values that pass the filter.
const aggregator = new Witnet.Aggregator({
  filters: [
    [Witnet.Types.FILTERS.deviationStandard, 1.5],
  ],
  reducer: Witnet.Types.REDUCERS.averageMean,
})

// Filters out any value that is more than 1.5 times the standard
// deviationaway from the average, then computes the average mean of the
// values that pass the filter.
const tally = new Witnet.Tally({
  filters: [
    [Witnet.Types.FILTERS.deviationStandard, 2.5],
  ],
  reducer: Witnet.Types.REDUCERS.averageMean,
})

// This is the Witnet.Request object that needs to be exported
const request = new Witnet.Request()
  .addSource(sushiswap)
  .setAggregator(aggregator) // Set the aggregator function
  .setTally(tally) // Set the tally function
  .setQuorum(10, 51) // Set witness count and minimum consensus percentage
  .setFees(10 ** 6, 10 ** 6) // Set economic incentives
  .setCollateral(5 * 10 ** 9) // Require 5 wits as collateral

// Do not forget to export the request object
export { request as default }

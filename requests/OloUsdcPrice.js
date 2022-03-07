import * as Witnet from "witnet-requests"

// Retrieve OLO-USDC-6 price from Oolongswap DEX at Boba mainnet
const oolongswap = new Witnet.Source("https://graph.witnet.io/?endpoint=https://graph.mainnet.boba.network/subgraphs/name/oolongswap/mainnet&data=%7B%22query%22%3A%22%7Bpairs(where%3A%20%7Btoken0%3A%20%5C%220x5008f837883ea9a07271a1b5eb0658404f5a9610%5C%22%2C%20token1%3A%20%5C%220x66a2a913e447d6b4bf33efbec43aaef87890fbbc%5C%22%7D)%20%7Btoken1Price%7D%7D%20%22%7D")
  .parseJSONMap()
  .getArray("pairs")
  .getMap(0)
  .getFloat("token1Price")
  .multiply(10 ** 6)
  .round()

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
  .addSource(oolongswap)
  .setAggregator(aggregator) // Set the aggregator function
  .setTally(tally) // Set the tally function
  .setQuorum(10, 51) // Set witness count and minimum consensus percentage
  .setFees(10 ** 6, 10 ** 6) // Set economic incentives
  .setCollateral(5 * 10 ** 9) // Require 5 wits as collateral

// Do not forget to export the request object
export { request as default }

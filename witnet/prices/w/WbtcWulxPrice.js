import * as Witnet from "witnet-requests"

const ultronswap = new Witnet.Source("https://exchange-info.ultron-dev.net/api/v1/ultronswap")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getMap("0x3a4f06431457de873b588846d139ec0d86275d54_0xd2b86a80a8f30b83843e247a50ecdc8d843d87dd")
  .getFloat("last_price")
  .multiply(10 ** 6)
  .round()

  // Filters out any value that is more than 1.5 times the standard
// deviationaway from the average, then computes the average mean of the
// values that pass the filter.
const aggregator = new Witnet.Aggregator({
    filters: [],
    reducer: Witnet.Types.REDUCERS.mode,
  })
  
  // Filters out any value that is more than 2.5 times the standard
  // deviationaway from the average, then computes the average mean of the
  // values that pass the filter.
  const tally = new Witnet.Tally({
    filters: [
      [Witnet.Types.FILTERS.deviationStandard, 2.5],
    ],
    reducer: Witnet.Types.REDUCERS.averageMedian,
  })
  
  // This is the Witnet.Request object that needs to be exported
  const request = new Witnet.Request()
    .addSource(ultronswap)
    .setAggregator(aggregator) // Set the aggregator function
    .setTally(tally) // Set the tally function
    .setQuorum(10, 51) // Set witness count and minimum consensus percentage
    .setFees(10 ** 6, 10 ** 6) // Set economic incentives
    .setCollateral(5 * 10 ** 9) // Require 5 wits as collateral
  
  // Do not forget to export the request object
  export { request as default }
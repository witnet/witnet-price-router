import * as Witnet from "witnet-requests"

// Retrieve KUS/KCS-6 from KUSWAP
const kuswap = new Witnet.GraphQLSource(
    "https://info.kuswap.finance/subgraphs/name/kuswap/swap",
    `{
      pair (id:"0x1ee6b0f7302b3c48c5fa89cd0a066309d9ac3584") {
        token0Price
      }
    }`,
  )
  .parseJSONMap()
  .getMap("data")
  .getMap("pair")
  .getFloat("token0Price")
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

// Filters out any value that is more than 2.5 times the standard
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
  .addSource(kuswap)
  .setAggregator(aggregator)
  .setTally(tally) // Set the tally function
  .setQuorum(10, 51) // Set witness count and minimum consensus percentage
  .setFees(10 ** 6, 10 ** 6) // Set economic incentives
  .setCollateral(5 * 10 ** 9) // Require 5 wits as collateral

// Do not forget to export the request object
export { request as default }

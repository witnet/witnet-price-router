import * as Witnet from "witnet-requests"

// Retrieve QUICK/USDC-6 price from Quickswap DEX on Polygon
const quickswap = new Witnet.GraphQLSource(
    "https://api.thegraph.com/subgraphs/name/sameepsi/quickswap-v3",
    `{
      pool (id: "0x022df0b3341b3a0157eea97dd024a93f7496d631") {
        token0Price
      }
    }`,
  )
  .parseJSONMap()
  .getMap("data")
  .getMap("pool")
  .getFloat("token0Price") // Get the `Float` value associated to the `token0Price` key
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
  .addSource(quickswap)
  .setAggregator(aggregator) // Set the aggregator function
  .setTally(tally) // Set the tally function
  .setQuorum(10, 51) // Set witness count and minimum consensus percentage
  .setFees(10 ** 6, 10 ** 6) // Set economic incentives
  .setCollateral(5 * 10 ** 9) // Require 5 wits as collateral

// Do not forget to export the request object
export { request as default }

import * as Witnet from "witnet-requests"
import * as WitnetSLA from "../../../../../migrations/witnet-slas"

// Retrieve QUICK/WETH-9 price from Quickswap DEX on Polygon
const quickswap = new Witnet.GraphQLSource(
    "https://api.thegraph.com/subgraphs/name/sameepsi/quickswap-v3",
    `{
      pool (id: "0xde2d1fd2e8238aba80a5b80c7262e4833d92f624") {
        token0Price
      }
    }`,
  )
  .parseJSONMap()
  .getMap("data")
  .getMap("pool")
  .getFloat("token0Price") // Get the `Float` value associated to the `token0Price` key
  .multiply(10 ** 9) // Use 9 digit precision
  .round() // Cast to integer

// Filters out any value that is more than 1.4 times the standard
// deviationaway from the average, then computes the average mean of the
// values that pass the filter.
const aggregator = new Witnet.Aggregator({
  filters: [
    [Witnet.Types.FILTERS.deviationStandard, 1.4],
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
  .setQuorum(WitnetSLA.numWitnesses, WitnetSLA.witnessingQuorum) // Set witness count and minimum consensus percentage
  .setFees(WitnetSLA.witnessReward, WitnetSLA.witnessCommitFee) // Set witness reward and witness commit fee
  .setCollateral(WitnetSLA.witnessCollateral) // Set witness collateral

// Do not forget to export the request object
export { request as default }

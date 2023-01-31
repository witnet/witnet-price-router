import * as Witnet from "witnet-requests"
import * as WitnetSLA from "../../../../../migrations/witnet-slas"

// Retrieve FRAX/USDT-6 price from the Gate.io API
const gateio = new Witnet.Source("https://data.gateapi.io/api2/1/ticker/frax_usdt")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getFloat("last") // Get the `Float` value associated to the `last` key
  .multiply(10 ** 6) // Use 6 digit precision
  .round() // Cast to integer

// Retrieve FRAX/USDT-6 price from the UniswapV3 DEX API:
const uniswap = new Witnet.GraphQLSource(
  "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3",
  `{
    pool (id: "0xc2a856c3aff2110c1171b8f942256d40e980c726") {
      token1Price
    }
  }`,
)
.parseJSONMap()
.getMap("data")
.getMap("pool")
.getFloat("token1Price") // Get the `Float` value associated to the `price` key
.multiply(10 ** 6) // Use 6 digit precision
.round() // Cast to integer

// Filters out any value that is more than 1.5 times the standard
// deviation away from the average, then computes the average mean of the
// values that pass the filter.
const aggregator = new Witnet.Aggregator({
  filters: [
    [Witnet.Types.FILTERS.deviationStandard, 1.5],
  ],
  reducer: Witnet.Types.REDUCERS.averageMean,
})

// Filters out any value that is more than 2.5 times the standard
// deviation away from the average, then computes the average mean of the
// values that pass the filter.
const tally = new Witnet.Tally({
  filters: [
    [Witnet.Types.FILTERS.deviationStandard, 2.5],
  ],
  reducer: Witnet.Types.REDUCERS.averageMean,
})

// This is the Witnet.Request object that needs to be exported
const request = new Witnet.Request()
  .addSource(gateio)
  .addSource(uniswap)
  .setAggregator(aggregator) // Set the aggregator function
  .setTally(tally) // Set the tally function
  .setQuorum(WitnetSLA.numWitnesses, WitnetSLA.witnessingQuorum) // Set witness count and minimum consensus percentage
  .setFees(WitnetSLA.witnessReward, WitnetSLA.witnessCommitFee) // Set witness reward and commit/reveal fees
  .setCollateral(WitnetSLA.witnessCollateral) // Set witness collateral

// Do not forget to export the request object
export { request as default }

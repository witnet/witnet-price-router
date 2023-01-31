import * as Witnet from "witnet-requests"

// Retrieve NATION/USDT-6 price from the MEXC API
const mexc = new Witnet.Source("https://www.mexc.com/open/api/v2/market/ticker?symbol=NATION_USDT")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getArray("data") // Access to the `Array` object at `data` key
  .getMap(0) // Access to the `Map` object at index 0
  .getFloat("last") // Get the `String` value associated to the `last` key
  .multiply(10 ** 6) // Use 6 digit precision
  .round() // Cast to integer

// Retrieve NATION/USDT-6 price from the UniswapV3 DEX API:
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
  .addSource(mexc)  
  .setAggregator(aggregator) // Set the aggregator function
  .setTally(tally) // Set the tally function
  .setQuorum(10, 51) // Set witness count and minimum consensus percentage
  .setFees(15 * 10 ** 7, 10 ** 7) // Witnessing fee: 0.1 wit; Commit/Reveal fee: 0.01 wit;
  .setCollateral(5 * 10 ** 9) // Require 5 wits as collateral

// Do not forget to export the request object
export { request as default }

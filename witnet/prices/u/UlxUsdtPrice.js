import * as Witnet from "witnet-requests"
import * as WitnetSLA from "../../../../../migrations/witnet-slas"

// Retrieve ULX/USDT-6 price from the UniswapV3 DEX API:
const uniswap = new Witnet.GraphQLSource(
    "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3",
    `{
      pool (id: "0x9adf4617804c762f86fc4e706ad0424da3b100a7") {
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
    .addSource(uniswap)
    .setAggregator(aggregator) // Set the aggregator function
    .setTally(tally) // Set the tally function
    .setQuorum(WitnetSLA.numWitnesses, WitnetSLA.witnessingQuorum) // Set witness count and minimum consensus percentage
    .setFees(WitnetSLA.witnessReward, WitnetSLA.witnessCommitFee) // Set witness reward and witness commit fee
    .setCollateral(WitnetSLA.witnessCollateral) // Set witness collateral
  
  // Do not forget to export the request object
  export { request as default }
  
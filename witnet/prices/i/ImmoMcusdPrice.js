import * as Witnet from "witnet-requests"
import * as WitnetSLA from "../../../../../migrations/witnet-slas"

// Retrieve IMMO/mCUSD-6 price from Ubeswap DEX at Celo mainnet
const oolongswap = new Witnet.GraphQLSource(
    "https://api.thegraph.com/subgraphs/name/ubeswap/ubeswap",
    `query PairsCurrent { 
      pairs(first: 100, orderBy: reserveUSD, orderDirection: desc, subgraphError: allow)
      { id token0Price } 
    }`,
  )
  .parseJSONMap()
  .getMap("data")
  .getArray("pairs")
  .filter( 
    // From all elements in the array,
    // select the one which "symbol" field
    // matches the IMMO/mCUSD pair contract address in Celo mainnet:
    new Witnet.Script([ Witnet.TYPES.MAP ])
      .getString("id")
      .match({ "0x7d63809ebf83ef54c7ce8ded3591d4e8fc2102ee": true }, false)
  )
  .getMap(0) // Get first (and only) element from the resulting array
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
  .addSource(oolongswap)
  .setAggregator(aggregator) // Set the aggregator function
  .setTally(tally) // Set the tally function
  .setQuorum(WitnetSLA.numWitnesses, WitnetSLA.witnessingQuorum) // Set witness count and minimum consensus percentage
  .setFees(WitnetSLA.witnessReward, WitnetSLA.witnessCommitFee) // Set witness reward and witness commit fee
  .setCollateral(WitnetSLA.witnessCollateral) // Set witness collateral

// Do not forget to export the request object
export { request as default }

import * as Witnet from "witnet-requests"
import * as WitnetSLA from "../../../../../migrations/witnet-slas"

// Retrieve OLO-USDC-6 price from Oolongswap DEX at Boba mainnet
const oolongswap = new Witnet.GraphQLSource(
    "https://api.thegraph.com/subgraphs/name/oolongswap/oolongswap-mainnet",
    `{
      pairs (
        where: {
          token0: "0x5008f837883ea9a07271a1b5eb0658404f5a9610",
          token1: "0x66a2a913e447d6b4bf33efbec43aaef87890fbbc"
        }
      ) {
        token1Price
      }
    }`,
  )
  .parseJSONMap()
  .getMap("data")
  .getArray("pairs")
  .getMap(0)
  .getFloat("token1Price")
  .multiply(10 ** 6)
  .round()

// Filters out any value that is more than 1.4 times the standard
// deviationaway from the average, then computes the average mean of the
// values that pass the filter.
const aggregator = new Witnet.Aggregator({
  filters: [
    [Witnet.Types.FILTERS.deviationStandard, 1.4],
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

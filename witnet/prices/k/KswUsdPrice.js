import * as Witnet from "witnet-requests"
import * as WitnetSLA from "../../../../../migrations/witnet-slas"

// Retrieves KSW/USD-6 price from Killswitch.finance
const killswitch = new Witnet.Source("https://api.killswitch.finance/ksw2/prices?chain=56")
  .parseJSONMap()
  .getFloat("0x270178366a592ba598c2e9d2971da65f7baa7c86")
  .multiply(10 ** 6)
  .round()

// Retrieves KSW/USD-6 price from Pancake API v2
const pancake = new Witnet.Source("https://api.pancakeswap.info/api/v2/tokens/0x270178366a592ba598c2e9d2971da65f7baa7c86")
  .parseJSONMap()
  .getMap("data")
  .getFloat("price")
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
  .addSource(killswitch)
  .setAggregator(aggregator) // Set the aggregator function
  .setTally(tally) // Set the tally function
  .setQuorum(WitnetSLA.numWitnesses, WitnetSLA.witnessingQuorum) // Set witness count and minimum consensus percentage
  .setFees(WitnetSLA.witnessReward, WitnetSLA.witnessCommitFee) // Set witness reward and witness commit fee
  .setCollateral(WitnetSLA.witnessCollateral) // Set witness collateral

// Do not forget to export the request object
export { request as default }

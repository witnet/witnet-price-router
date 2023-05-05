import * as Witnet from "witnet-requests"
import * as WitnetSLA from "../../../../../migrations/witnet-slas"

const ultronswap = new Witnet.GraphQLSource(
  "https://graph-node.ultron-dev.net/subgraphs/name/root/ultronswap-exchange",
  `{
    pairHourDatas(
      first: 1
      where: {pair: "0x166559b5965cefd8d3d999ae068ea8c481702dc5"}
      orderBy: hourStartUnix
      orderDirection: desc
    ) {
      pair {
        token1Price
      }
    }
  }`,
)
.parseJSONMap()
.getMap("data")
.getArray("pairHourDatas")
.getMap(0)
.getMap("pair")
.getFloat("token1Price")
.multiply(10 ** 6)
.round()

// Apply no filter on aggregation, as only one source is referred.
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
  .setQuorum(WitnetSLA.numWitnesses, WitnetSLA.witnessingQuorum) // Set witness count and minimum consensus percentage
  .setFees(WitnetSLA.witnessReward, WitnetSLA.witnessCommitFee) // Set witness reward and witness commit fee
  .setCollateral(WitnetSLA.witnessCollateral) // Set witness collateral

// Do not forget to export the request object
export { request as default }
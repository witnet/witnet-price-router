import * as Witnet from "witnet-requests"
import * as WitnetSLA from "../../../../../migrations/witnet-slas"

// Retrieve DAI/USD-6 price from the Binance HTTP-GET API
const binance = new Witnet.Source("https://api.binance.us/api/v3/ticker/price?symbol=DAIUSD")
  .parseJSONMap()
  .getFloat("price")
  .multiply(10 ** 6)
  .round()

// Retrieve DAI/USD-6 price from Bitstamp
const bitstamp = new Witnet.Source("https://www.bitstamp.net/api/v2/ticker/daiusd")
  .parseJSONMap()
  .getFloat("last")
  .multiply(10 ** 6)
  .round()

// Retrieve DAI/USD-6 price from Bittrex
const bittrex = new Witnet.Source("https://api.bittrex.com/v3/markets/DAI-USD/ticker")
  .parseJSONMap()
  .getFloat("lastTradeRate")
  .multiply(10 ** 6)
  .round()

// Retrieve DAI/USD-6 price from Kraken
const kraken = new Witnet.Source("https://api.kraken.com/0/public/Ticker?pair=DAIUSD")
  .parseJSONMap()
  .getMap("result")
  .getMap("DAIUSD")
  .getArray("a")
  .getFloat(0)
  .multiply(10 ** 6)
  .round()

// Retrieves DAI/USD-6 price from Gate.io
const gateio = new Witnet.Source("https://data.gateapi.io/api2/1/ticker/dai_usd")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getFloat("last") // Get the `Float` value associated to the `last` key
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
    [Witnet.Types.FILTERS.deviationStandard, 1.5],
  ],
  reducer: Witnet.Types.REDUCERS.averageMean,
})

// This is the Witnet.Request object that needs to be exported
const request = new Witnet.Request()
  .addSource(binance)
  .addSource(bitstamp)
  .addSource(bittrex)
  .addSource(kraken)
  .addSource(gateio)
  .setAggregator(aggregator) // Set the aggregator function
  .setTally(tally) // Set the tally function
  .setQuorum(WitnetSLA.numWitnesses, WitnetSLA.witnessingQuorum) // Set witness count and minimum consensus percentage
  .setFees(WitnetSLA.witnessReward, WitnetSLA.witnessCommitFee) // Set witness reward and witness commit fee
  .setCollateral(WitnetSLA.witnessCollateral) // Set witness collateral

// Do not forget to export the request object
export { request as default }

import * as Witnet from "witnet-requests"

// Retrieves USDT price of BOBA from AEX.ZONE
const aex = new Witnet.Source("https://api.aex.zone/v3/ticker.php?mk_type=USDT&coinname=BOBA")
  .parseJSONMap()
  .getMap("data")
  .getMap("ticker")
  .getFloat("last")
  .multiply(10 ** 6)
  .round()

// Retrieves USDT price of BOBA from the Gate.io API
const gateio = new Witnet.Source("https://data.gateapi.io/api2/1/ticker/boba_usdt")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getFloat("last") // Get the `Float` value associated to the `last` key
  .multiply(10 ** 6) // Use 6 digit precision
  .round() // Cast to integer

// Retrieves USDT price of BOBA from the MEXC API
const mexc = new Witnet.Source("https://www.mxc.com/open/api/v2/market/ticker?symbol=BOBA_USDT")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getArray("data") // Access to the `Array` object at `data` key
  .getMap(0) // Access to the `Map` object at index 0
  .getString("last") // Get the `String` value associated to the `last` key
  .asFloat() // Parse `String` as `Float`
  .multiply(10 ** 6) // Use 6 digit precision
  .round() // Cast to integer

// Retrieves USDT price of BOBA from XT.COM
const xtcom = new Witnet.Source("https://www.xt.pub/exchange/api/markets/returnTicker")
  .parseJSONMap()
  .getMap("BOBA_USDT")
  .getFloat("last")
  .multiply(10 ** 6)
  .round()

// Filters out any value that is more than 2.5 times the standard
// deviationaway from the average, then computes the average mean of the
// values that pass the filter.
const aggregator = new Witnet.Aggregator({
  filters: [
    [Witnet.Types.FILTERS.deviationStandard, 2.5],
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
  .addSource(aex)
  .addSource(gateio)
  .addSource(mexc)
  .addSource(xtcom)
  .setAggregator(aggregator) // Set the aggregator function
  .setTally(tally) // Set the tally function
  .setQuorum(10, 70) // Set witness count and minimum consensus percentage
  .setFees(10 ** 6, 10 ** 6) // Set economic incentives
  .setCollateral(5 * 10 ** 9) // Require 5 wits as collateral

// Do not forget to export the request object
export { request as default }

import * as Witnet from "witnet-requests"

// Retrieves USDT price of CFX from the Binance API
const binance = new Witnet.Source("https://api.binance.com/api/v3/ticker/price?symbol=CFXUSDT")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getFloat("price") // Get the `Float` value associated to the `price` key
  .multiply(1000000) // Use 6 digit precision
  .round() // Cast to integer

// Retrieves USDT price of CFX from the OkEx API
const okex = new Witnet.Source("https://www.okex.com/api/index/v3/CFX-USD/constituents")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getMap("data") // Access to the `Map` object at `data` key
  .getFloat("last") // Get the `Float` value associated to the `last` key
  .multiply(1000000) // Use 6 digit precision
  .round() // Cast to integer

// Retrieves USDT price of CFX from the Gate.io API
const gateio = new Witnet.Source("https://data.gateapi.io/api2/1/ticker/cfx_usdt")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getFloat("last") // Get the `Float` value associated to the `last` key
  .multiply(1000000) // Use 6 digit precision
  .round() // Cast to integer

// Retrieves USDT price of CFX from the MEXC API
const mexc = new Witnet.Source("https://www.mxc.com/open/api/v2/market/ticker?symbol=CFX_USDT")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getArray("data") // Access to the `Array` object at `data` key
  .getMap(0) // Access to the `Map` object at index 0
  .getString("last") // Get the `String` value associated to the `last` key
  .asFloat() // Parse `String` as `Float`
  .multiply(1000000) // Use 6 digit precision
  .round() // Cast to integer

// Retrieves USDT price of CFX from the BKEX API
const bkex = new Witnet.Source("https://api.bkex.cc/v2/q/ticker/price?symbol=CFX_USDT")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getArray("data") // Access to the `Array` object at `data` key
  .getMap(0) // Access to the `Map` object at index 0
  .getFloat("price") // Get the `String` value associated to the `price` key
  .multiply(1000000) // Use 6 digit precision
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
  .addSource(okex)
  .addSource(gateio)
  .addSource(mexc)
  .addSource(bkex)
  .setAggregator(aggregator) // Set the aggregator function
  .setTally(tally) // Set the tally function
  .setQuorum(100, 70) // Set witness count
  .setFees(10, 1) // Set economic incentives

// Do not forget to export the request object
export { request as default }
import * as Witnet from "witnet-requests"

// Retrieves USDT price of CFX from the Binance API
const binance = new Witnet.Source("https://api.binance.com/api/v3/ticker/price?symbol=CFXUSDT")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getFloat("price") // Get the `Float` value associated to the `price` key
  .multiply(10 ** 6) // Use 6 digit precision
  .round() // Cast to integer

// Retrieves USDT price of CFX from the Gate.io API
const gateio = new Witnet.Source("https://data.gateapi.io/api2/1/ticker/cfx_usdt")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getFloat("last") // Get the `Float` value associated to the `last` key
  .multiply(10 ** 6) // Use 6 digit precision
  .round() // Cast to integer

// Retrieves CFX/USDT-6 from KUCOIN API
const kucoin = new Witnet.Source("https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=CFX-USDT")
  .parseJSONMap() 
  .getMap("data")
  .getFloat("price")
  .multiply(10 ** 6)
  .round()

// Retrieves USDT price of CFX from the OkEx API
const okex = new Witnet.Source("https://www.okx.com/api/v5/market/ticker?instId=CFX-USDT")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getArray("data") // Access to the `Map` object at `data` key
  .getMap(0)
  .getFloat("last") // Get the `Float` value associated to the `last` key
  .multiply(10 ** 6) // Use 6 digit precision
  .round() // Cast to integer

// Retrieves USDT price of CFX from the MEXC API
const mexc = new Witnet.Source("https://www.mexc.com/open/api/v2/market/ticker?symbol=CFX_USDT")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getArray("data") // Access to the `Array` object at `data` key
  .getMap(0) // Access to the `Map` object at index 0
  .getString("last") // Get the `String` value associated to the `last` key
  .asFloat() // Parse `String` as `Float`
  .multiply(10 ** 6) // Use 6 digit precision
  .round() // Cast to integer

// Filters out any value that is more than 2.5 times the standard
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
  .addSource(binance)  
  .addSource(gateio)
  .addSource(kucoin)  
  .addSource(mexc)
  .addSource(okex)
  .setAggregator(aggregator) // Set the aggregator function
  .setTally(tally) // Set the tally function
  .setQuorum(10, 51) // Set witness count and minimum consensus percentage
  .setFees(10 ** 6, 10 ** 6) // Set economic incentives
  .setCollateral(5 * 10 ** 9) // Require 5 wits as collateral

// Do not forget to export the request object
export { request as default }

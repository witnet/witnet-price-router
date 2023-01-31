import * as Witnet from "witnet-requests"

// Retrieve MTRG/USDT-6 price from the Gate.io API
const gateio = new Witnet.Source("https://data.gateapi.io/api2/1/ticker/mtrg_usdt")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getFloat("last") // Get the `Float` value associated to the `last` key
  .multiply(10 ** 6) // Use 6 digit precision
  .round() // Cast to integer

// Retrieve MTRG/USDT-6 price from the HTTP-GET KuCoin API
const kucoin = new Witnet.Source("https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=MTRG-USDT")
  .parseJSONMap() 
  .getMap("data")
  .getFloat("price")
  .multiply(10 ** 6)
  .round()

// Retrieves MTRG/USDT-6 pricefrom the MEXC API
const mexc = new Witnet.Source("https://www.mexc.com/open/api/v2/market/ticker?symbol=MTRG_USDT")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getArray("data") // Access to the `Array` object at `data` key
  .getMap(0) // Access to the `Map` object at index 0
  .getFloat("last") // Get the `String` value associated to the `last` key
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
  .addSource(gateio)
  .addSource(kucoin)
  .addSource(mexc)  
  .setAggregator(aggregator) // Set the aggregator function
  .setTally(tally) // Set the tally function
  .setQuorum(10, 51) // Set witness count and minimum consensus percentage
  .setFees(15 * 10 ** 7, 10 ** 7) // Witnessing fee: 0.1 wit; Commit/Reveal fee: 0.01 wit;
  .setCollateral(15 * 10 ** 8) // Require 5 wits as collateral

// Do not forget to export the request object
export { request as default }

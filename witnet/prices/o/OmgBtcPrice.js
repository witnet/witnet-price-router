import * as Witnet from "witnet-requests"

// Retrieves BTC price of OMG from the BitStamp API
const bitstamp = new Witnet.Source("https://www.bitstamp.net/api/v2/ticker/omgbtc/")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getFloat("last") // Get the `Float` value associated to the `last` key
  .multiply(10 ** 9) // Use 9 digit precision
  .round() // Cast to integer

// Retrieves BTC price of OMG from the Binance API
const binance = new Witnet.Source("https://api.binance.com/api/v3/ticker/price?symbol=OMGBTC")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getFloat("price") // Get the `Float` value associated to the `price` key
  .multiply(10 ** 9) // Use 9 digit precision
  .round() // Cast to integer

// Retrieves BTC price of OMG from the Gate.io API
const gateio = new Witnet.Source("https://data.gateapi.io/api2/1/ticker/omg_btc")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getFloat("last") // Get the `Float` value associated to the `last` key
  .multiply(10 ** 9) // Use 9 digit precision
  .round() // Cast to integer

// Retrieves BTC price of OMG from the MEXC API
const mexc = new Witnet.Source("https://www.mexc.com/open/api/v2/market/ticker?symbol=OMG_BTC")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getArray("data") // Access to the `Array` object at `data` key
  .getMap(0) // Access to the `Map` object at index 0
  .getString("last") // Get the `String` value associated to the `last` key
  .asFloat() // Parse `String` as `Float`
  .multiply(10 ** 9) // Use 9 digit precision
  .round() // Cast to integer

// Retrieves BTC price of OMG from the bitfinex API
const bitfinex = new Witnet.Source("https://api.bitfinex.com/v1/pubticker/omgbtc")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getFloat("last_price") // Get the `Float` value associated to the `last_pice` key
  .multiply(10 ** 9) // Use 9 digit precision
  .round() // Cast to integer

// Retrieves BTC price of OMG from the kraken API
  const kraken = new Witnet.Source("https://api.kraken.com/0/public/Ticker?pair=OMGBTC")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getMap("result") // Access to the `Map` object at `result` key
  .getMap("OMGXBT") // Access to the `Map` object at `OMGXBT` key
  .getArray("a") // Access to the `Array` object at `a` key
  .getFloat(0) // Get the `Float` value associated to the object at index 0
  .multiply(10 ** 9) // Use 9 digit precision
  .round() // Cast to integer


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
    [ Witnet.Types.FILTERS.deviationStandard, 2.5 ],
  ],
  reducer: Witnet.Types.REDUCERS.averageMean,
})

// This is the Witnet.Request object that needs to be exported
const request = new Witnet.Request()
  .addSource(bitstamp) // Use source 1
  .addSource(binance) // Use source 2
  .addSource(gateio) // Use source 3
  .addSource(mexc) // Use source 4
  .addSource(bitfinex) // Use source 5
  .addSource(kraken) // Use source 6
  .setAggregator(aggregator) // Set the aggregator function
  .setTally(tally) // Set the tally function
  .setQuorum(10, 70) // Set witness count and minimum consensus percentage
  .setFees(15 * 10 ** 7, 10 ** 7) // Witnessing fee: 0.1 wit; Commit/Reveal fee: 0.01 wit;
  .setCollateral(15 * 10 ** 8) // Require 5 wits as collateral

// Do not forget to export the request object
export { request as default }

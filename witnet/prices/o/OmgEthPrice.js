import * as Witnet from "witnet-requests"

// Retrieves ETH price of OMG from the Binance API
const binance = new Witnet.Source("https://api.binance.com/api/v3/ticker/price?symbol=OMGETH")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getFloat("price") // Get the `Float` value associated to the `price` key
  .multiply(10 ** 9) // Use 9 digit precision
  .round() // Cast to integer

// Retrieves ETH price of OMG from the Gate.io API
const gateio = new Witnet.Source("https://data.gateapi.io/api2/1/ticker/omg_eth")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getFloat("last") // Get the `Float` value associated to the `last` key
  .multiply(10 ** 9) // Use 9 digit precision
  .round() // Cast to integer

// Retrieves ETH price of OMG from the coinyep API
const coinyep = new Witnet.Source("https://coinyep.com/api/v1/?from=OMG&to=ETH&lang=es&format=json")
  .parseJSONMap() // Parse a Map from the retrieved String
  .getFloat("price") // Get the `Float` value associated to the `price` key
  .multiply(10 ** 9) // Use 9 digit precision
  .round()

// Retrieves ETH price of OMG from the messari API
const messari = new Witnet.Source("https://data.messari.io/api/v1/assets/omg/metrics/market-data?fields=market_data/price_eth")
  .parseJSONMap() // Parse a Map from the retrieved String
  .getMap("data") // Access to the `Map` object at `data` key
  .getMap("market_data") // Access to the `Map` object at `market_data` key
  .getFloat("price_eth") // Get the `Float` value associated to the `price_eth` key
  .multiply(10 ** 9) // Use 9 digit precision
  .round() // Cast to integer

// Retrieves ETH price of OMG from the bitfinex API
const bitfinex = new Witnet.Source("https://api.bitfinex.com/v1/pubticker/omgeth")
  .parseJSONMap() // Parse a Map from the retrieved String
  .getFloat("last_price") // Get the `Float` value associated to the `last_pice` key
  .multiply(10 ** 9) // Use 9 digit precision
  .round() // Cast to integer


// Retrieves ETH price of OMG from the kraken API
  const kraken = new Witnet.Source("https://api.kraken.com/0/public/Ticker?pair=OMGETH")
  .parseJSONMap() // Parse a Map from the retrieved String
  .getMap("result") // Access to the `Map` object at `result` key
  .getMap("OMGETH") // Access to the `Map` object at `OMGETH` key
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
    [Witnet.Types.FILTERS.deviationStandard, 2.5],
  ],
  reducer: Witnet.Types.REDUCERS.averageMean,
})

// This is the Witnet.Request object that needs to be exported
const request = new Witnet.Request()
  .addSource(binance) // Use source 1
  .addSource(gateio) // Use source 2
  // .addSource(coinyep) // Use source 3
  .addSource(messari) // use source 4
  .addSource(bitfinex) // use source 5
  .addSource(kraken) // use source 6
  .setAggregator(aggregator) // Set the aggregator function
  .setTally(tally) // Set the tally function
  .setQuorum(10, 70) // Set witness count and minimum consensus percentage
  .setFees(15 * 10 ** 7, 10 ** 7) // Witnessing fee: 0.1 wit; Commit/Reveal fee: 0.01 wit;
  .setCollateral(15 * 10 ** 8) // Require 5 wits as collateral

// Do not forget to export the request object
export { request as default }

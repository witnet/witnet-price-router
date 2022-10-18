import * as Witnet from "witnet-requests"

// Retrieve APE/USD-6 price from the Binance HTTP-GET API
const binance = new Witnet.Source("https://api.binance.us/api/v3/ticker/price?symbol=DOGEUSD")
  .parseJSONMap()
  .getFloat("price")
  .multiply(10 ** 6)
  .round()

// Retrieve DOGE/USD-6 price from Coinbase
const coinbase = new Witnet.Source("https://api.coinbase.com/v2/exchange-rates?currency=USD")
  .parseJSONMap()
  .getMap("data")
  .getMap("rates")
  .getFloat("DOGE")
  .power(-1)
  .multiply(10 ** 6)
  .round()

// Retrieve DOGE/USD-6 price from FTX
const ftx = new Witnet.Source("https://ftx.com/api/markets")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getArray("result") // Access to the `Map` object at `data` key
  .filter( 
    // From all elements in the map,
    // select the one which "name" field
    // matches "BTC/USD":
    new Witnet.Script([ Witnet.TYPES.MAP ])
      .getString("name")
      .match({ "DOGE/USD": true }, false)
  )
  .getMap(0) // Get first (and only) element from the resulting Map
  .getFloat("price") // Get the `Float` value associated to the `price` key
  .multiply(10 ** 6) // Use 6 digit precision
  .round() // Cast to integer

// Retrieve DOGE/USD-6 price from Kraken
const kraken = new Witnet.Source("https://api.kraken.com/0/public/Ticker?pair=DOGEUSD")
  .parseJSONMap()
  .getMap("result")
  .getMap("XDGUSD")
  .getArray("a")
  .getFloat(0)
  .multiply(10 ** 6)
  .round()

// Retrieve DOGE/USD-6 price from Bittrex
const bittrex = new Witnet.Source("https://api.bittrex.com/v3/markets/DOGE-USD/ticker")
  .parseJSONMap()
  .getFloat("lastTradeRate")
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
  .addSource(binance)
  .addSource(bittrex)
  .addSource(coinbase)
  .addSource(ftx)
  .addSource(kraken)
  .setAggregator(aggregator) // Set the aggregator function
  .setTally(tally) // Set the tally function
  .setQuorum(10, 51) // Set witness count and minimum consensus percentage
  .setFees(10 ** 6, 10 ** 6) // Set economic incentives
  .setCollateral(5 * 10 ** 9) // Require 5 wits as collateral

// Do not forget to export the request object
export { request as default }
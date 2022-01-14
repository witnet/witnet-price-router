import * as Witnet from "witnet-requests"

// Retrieve FXS/USDT-6 price from the Binance HTTP-GET API
const binance = new Witnet.Source("https://api.binance.com/api/v3/ticker/price?symbol=FXSUSDT")
  .parseJSONMap()
  .getFloat("price")
  .multiply(10 ** 6)
  .round()

// Retrieve FXS/USDT-6 price from the Bitmax HTTP-GET API
const bitmax = new Witnet.Source("https://ascendex.com/api/pro/v1/spot/ticker?symbol=FXS/USDT")
  .parseJSONMap()
  .getMap("data")
  .getFloat("close")
  .multiply(10 ** 6)
  .round()

// Retrieve FXS/USDT-6 price from the Gate.io HTTP-GET API
const gateio = new Witnet.Source("https://data.gateapi.io/api2/1/ticker/fxs_usdt")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getFloat("last") // Get the `Float` value associated to the `last` key
  .multiply(10 ** 6) // Use 6 digit precision
  .round() // Cast to integer

// Retrieves METIS/USDT-6 from the Hoo HTTP-GET API
const hoo = new Witnet.Source("https://api.hoolgd.com/open/v1/tickers/market")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getArray("data") // Access to the `Map` object at `data` key
  .filter( 
    // From all elements in the map,
    // select the one which "symbol" field
    // matches "FXS-USDT":
    new Witnet.Script([ Witnet.TYPES.MAP ])
      .getString("symbol")
      .match({ "FXS-USDT": true }, false)
  )
  .getMap(0) // Get first (and only) element from the resulting Map
  .getFloat("price") // Get the `Float` value associated to the `price` key
  .multiply(10 ** 6) // Use 6 digit precision
  .round() // Cast to integer

// Retrieves FXS/USDT-6 from the HTTP-GET KuCoin API
const kucoin = new Witnet.Source("https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=FXS-USDT")
  .parseJSONMap() 
  .getMap("data")
  .getFloat("price")
  .multiply(10 ** 6)
  .round()

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
  .addSource(bitmax)
  .addSource(gateio)
  .addSource(hoo)
  .addSource(kucoin)
  .setAggregator(aggregator) // Set the aggregator function
  .setTally(tally) // Set the tally function
  .setQuorum(10, 51) // Set witness count and minimum consensus percentage
  .setFees(10 ** 6, 10 ** 6) // Set economic incentives
  .setCollateral(5 * 10 ** 9) // Require 5 wits as collateral

// Do not forget to export the request object
export { request as default }

import * as Witnet from "witnet-requests"

// Retrieves CUBE/USDT-6 from the BitGet API:
const bitget = new Witnet.Source("https://api.bitget.com/api/spot/v1/market/ticker?symbol=CUBENETWORKUSDT_SPBL")
  .parseJSONMap()
  .getMap("data")
  .getFloat("close")
  .multiply(10 ** 6)
  .round()

// Retrieves CUBE/USDT-6 from the BitMart API:
const bitmart = new Witnet.Source("https://api-cloud.bitmart.com/spot/v1/ticker?symbol=CUBE_USDT")
  .parseJSONMap()
  .getMap("data")
  .getArray("tickers")
  .getMap(0)
  .getFloat("last_price")
  .multiply(10 ** 6)
  .round()

// Retrieves CUBE/USDT-6 price from the Gate.io API
const gateio = new Witnet.Source("https://data.gateapi.io/api2/1/ticker/cube_usdt")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getFloat("last") // Get the `Float` value associated to the `last` key
  .multiply(10 ** 6) // Use 6 digit precision
  .round() // Cast to integer

// Retrieves CUBE/USDT-6 price from the HUOBI API
const huobi = new Witnet.Source("https://api.huobi.pro/market/detail/merged?symbol=cubeusdt")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getMap("tick") // Access to the `Map` object at index 0
  .getFloat("close") // Get the `String` value associated to the `last` key
  .multiply(10 ** 6) // Use 6 digit precision
  .round() // Cast to integer

// Retrieves CUBE/USDT-6 from the XT.com HTTP-GET API
const xt = new Witnet.Source("https://www.xt.pub/exchange/api/markets/returnTicker")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getMap("CUBE_USDT") // Access to the `Map` object at `data` key
  .getFloat("last") // Get the `Float` value associated to the `price` key
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
0
// This is the Witnet.Request object that needs to be exported
const request = new Witnet.Request()
  // .addSource(bitget)
  // .addSource(bitmart)
  .addSource(gateio)
  // .addSource(huobi)
  // .addSource(xt)
  .setAggregator(aggregator) // Set the aggregator function
  .setTally(tally) // Set the tally function
  .setQuorum(10, 51) // Set witness count and minimum consensus percentage
  .setFees(15 * 10 ** 7, 10 ** 7) // Witnessing fee: 0.1 wit; Commit/Reveal fee: 0.01 wit;
  .setCollateral(5 * 10 ** 9) // Require 5 wits as collateral

// Do not forget to export the request object
export { request as default }

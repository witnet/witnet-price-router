import * as Witnet from "witnet-requests"

// Retrieves CRO/USDT-6 price from the Bitmax API
const bitmax = new Witnet.Source("https://ascendex.com/api/pro/v1/spot/ticker?symbol=CRO/USDT")
  .parseJSONMap()
  .getMap("data")
  .getFloat("close")
  .multiply(10 ** 6)
  .round()

// Retrieves CRO/USDT-6 price from Bittrex API
const bittrex = new Witnet.Source("https://api.bittrex.com/v3/markets/CRO-USDT/ticker")
  .parseJSONMap()
  .getFloat("lastTradeRate")
  .multiply(10 ** 6)
  .round() 

// Retrieves CRO/USDT-6 price from the Gate.io HTTP-GET API
const gateio = new Witnet.Source("https://data.gateapi.io/api2/1/ticker/cro_usdt")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getFloat("last") // Get the `Float` value associated to the `last` key
  .multiply(10 ** 6) // Use 6 digit precision
  .round() // Cast to integer

// Retrieves CRO/USDT-6 from KUCOIN API
const kucoin = new Witnet.Source("https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=CRO-USDT")
  .parseJSONMap() 
  .getMap("data")
  .getFloat("price")
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
  .addSource(bitmax)
  .addSource(bittrex)
  .addSource(gateio)
  .addSource(kucoin)
  .setAggregator(aggregator) // Set the aggregator function
  .setTally(tally) // Set the tally function
  .setQuorum(10, 51) // Set witness count and minimum consensus percentage
  .setFees(10 ** 8, 10 ** 7) // Witnessing fee: 0.1 wit; Commit/Reveal fee: 0.01 wit;
  .setCollateral(5 * 10 ** 9) // Require 5 wits as collateral

// Do not forget to export the request object
export { request as default }

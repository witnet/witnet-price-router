import * as Witnet from "witnet-requests"

// Retrieve REEF/USDT-6 price from the Binance API:
const binance = new Witnet.Source("https://api.binance.com/api/v3/ticker/price?symbol=REEFUSDT")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getFloat("price") // Get the `Float` value associated to the `price` key
  .multiply(10 ** 6) // Use 6 digit precision
  .round() // Cast to integer

// Retrieve REEF/USDT-6 price from the BITRUE API:
const bitrue = new Witnet.Source("https://openapi.bitrue.com/api/v1/ticker/price?symbol=REEFUSDT")
  .parseJSONMap()
  .getFloat("price")
  .multiply(10 ** 6)
  .round()

// Retrieve REEF/USDT-6 price from the BKEX API:
const bkex = new Witnet.Source("https://api.bkex.com/v2/q/ticker/price?symbol=REEF_USDT")
  .parseJSONMap()
  .getArray("data")
  .getMap(0)
  .getFloat("price")
  .multiply(10 ** 6)
  .round()

// Retrieve REEF/USDT-6 price from the DIGIFINEX API:
const digifinex = new Witnet.Source("https://openapi.digifinex.com/v3/ticker?symbol=reef_usdt")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getArray("ticker") // Access to the `Array` object at `data` key
  .getMap(0) // Access to the `Map` object at index 0
  .getFloat("last") // Get the `String` value associated to the `last` key
  .multiply(10 ** 6) // Use 6 digit precision
  .round() // Cast to integer

// Retrieve REEF/USDT-6 price from the Gate.io API:
const gateio = new Witnet.Source("https://data.gateapi.io/api2/1/ticker/reef_usdt")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getFloat("last") // Get the `Float` value associated to the `last` key
  .multiply(10 ** 6) // Use 6 digit precision
  .round() // Cast to integer

// Retrieve REEF/USDT-6 price from the HITBTC API:
const hitbtc = new Witnet.Source("https://api.hitbtc.com/api/3/public/ticker?symbols=REEFUSDT")
  .parseJSONMap() 
  .getMap("REEFUSDT")
  .getFloat("last")
  .multiply(10 ** 6)
  .round()

// Retrieve REEF/USDT-6 price from the KUCOIN API:
const kucoin = new Witnet.Source("https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=REEF-USDT")
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
  .addSource(bitrue)
  .addSource(bkex)
  .addSource(digifinex)
  .addSource(gateio)
  .addSource(hitbtc)
  .addSource(kucoin)  
  .setAggregator(aggregator) // Set the aggregator function
  .setTally(tally) // Set the tally function
  .setQuorum(10, 51) // Set witness count and minimum consensus percentage
  .setFees(10 ** 6, 10 ** 6) // Set economic incentives
  .setCollateral(5 * 10 ** 9) // Require 5 wits as collateral

// Do not forget to export the request object
export { request as default }

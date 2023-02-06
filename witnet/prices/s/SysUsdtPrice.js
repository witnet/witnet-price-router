import * as Witnet from "witnet-requests"
import * as WitnetSLA from "../../../../../migrations/witnet-slas"

// Retrieve SYS/USDT-6 price from the Binance API:
const binance = new Witnet.Source("https://api.binance.com/api/v3/ticker/price?symbol=SYSUSDT")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getFloat("price") // Get the `Float` value associated to the `price` key
  .multiply(10 ** 6) // Use 6 digit precision
  .round() // Cast to integer

// Retrieve SYS/USDT-6 price from the BIGET API:
const bitget = new Witnet.Source("https://api.bitget.com/api/spot/v1/market/ticker?symbol=SYSUSDT_SPBL")
  .parseJSONMap()
  .getMap("data")
  .getFloat("close")
  .multiply(10 ** 6)
  .round()

// Retrieve SYS/USDT-6 price from the BKEX API:
const bkex = new Witnet.Source("https://api.bkex.com/v2/q/ticker/price?symbol=SYS_USDT")
  .parseJSONMap()
  .getArray("data")
  .getMap(0)
  .getFloat("price")
  .multiply(10 ** 6)
  .round()

// Retrieve SYS/USDT-6 price from the DIGIFINEX API:
const digifinex = new Witnet.Source("https://openapi.digifinex.com/v3/ticker?symbol=sys_usdt")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getArray("ticker") // Access to the `Array` object at `data` key
  .getMap(0) // Access to the `Map` object at index 0
  .getFloat("last") // Get the `String` value associated to the `last` key
  .multiply(10 ** 6) // Use 6 digit precision
  .round() // Cast to integer

// Retrieve SYS/USDT-6 price from the Gate.io API:
const gateio = new Witnet.Source("https://data.gateapi.io/api2/1/ticker/sys_usdt")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getFloat("last") // Get the `Float` value associated to the `last` key
  .multiply(10 ** 6) // Use 6 digit precision
  .round() // Cast to integer

// Retrieve SYS/USDT-6 price from the KUCOIN API:
const kucoin = new Witnet.Source("https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=SYS-USDT")
  .parseJSONMap() 
  .getMap("data")
  .getFloat("price")
  .multiply(10 ** 6)
  .round()

// Retrieve SYS/USDT-6 price from the MEXC API:
const mexc = new Witnet.Source("https://www.mexc.com/open/api/v2/market/ticker?symbol=SYS_USDT")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getArray("data") // Access to the `Array` object at `data` key
  .getMap(0) // Access to the `Map` object at index 0
  .getString("last") // Get the `String` value associated to the `last` key
  .asFloat() // Parse `String` as `Float`
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
  .addSource(binance)  
  .addSource(bitget)
  .addSource(bkex)
  // .addSource(digifinex)
  .addSource(gateio)
  .addSource(kucoin)  
  .addSource(mexc)
  .setAggregator(aggregator) // Set the aggregator function
  .setTally(tally) // Set the tally function
  .setQuorum(WitnetSLA.numWitnesses, WitnetSLA.witnessingQuorum) // Set witness count and minimum consensus percentage
  .setFees(WitnetSLA.witnessReward, WitnetSLA.witnessCommitFee) // Set witness reward and witness commit fee
  .setCollateral(WitnetSLA.witnessCollateral) // Set witness collateral

// Do not forget to export the request object
export { request as default }

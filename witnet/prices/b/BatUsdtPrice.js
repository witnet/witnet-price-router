import * as Witnet from "witnet-requests"
import * as WitnetSLA from "../../../../../migrations/witnet-slas"

// Retrieve BAT/USDT-6 price from Binance.US
const binance = new Witnet.Source("https://api.binance.us/api/v3/ticker?symbol=BATUSDT")
  .parseJSONMap()
  .getFloat("lastPrice")
  .multiply(10 ** 6)
  .round()

// Retrieve BAT/USDT-6 price from Bitrue
const bitrue = new Witnet.Source("https://openapi.bitrue.com/api/v1/ticker/price?symbol=BATUSDT")
  .parseJSONMap()
  .getFloat("price")
  .multiply(10 ** 6)
  .round()

// Retrieve BAT/USDT-6 price from Upbit
const upbit = new Witnet.Source("https://api.upbit.com/v1/ticker?markets=USDT-BAT")
  .parseJSONArray()
  .getMap(0)
  .getFloat("trade_price")
  .multiply(10 ** 6)
  .round()

// Retrieves BAT/USDT-6 price from the OkEx API
const okex = new Witnet.Source("https://www.okx.com/api/v5/market/ticker?instId=BAT-USDT")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getArray("data") // Access to the `Map` object at `data` key
  .getMap(0)
  .getFloat("last") // Get the `Float` value associated to the `last` key
  .multiply(10 ** 6) // Use 6 digit precision
  .round() // Cast to integer

// Retrieve BAT/USDT-6 price from Coinbase
const coinbase = new Witnet.Source("https://api.coinbase.com/v2/exchange-rates?currency=BAT")
  .parseJSONMap()
  .getMap("data")
  .getMap("rates")
  .getFloat("USDT")
  .multiply(10 ** 6)
  .round()

// Filters out any value that is more than 1.4 times the standard
// deviationaway from the average, then computes the average mean of the
// values that pass the filter.
const aggregator = new Witnet.Aggregator({
  filters: [
    [Witnet.Types.FILTERS.deviationStandard, 1.4],
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
  .addSource(upbit)
  .addSource(okex)
  .addSource(coinbase)
  .setAggregator(aggregator) // Set the aggregator function
  .setTally(tally) // Set the tally function
  .setQuorum(WitnetSLA.numWitnesses, WitnetSLA.witnessingQuorum) // Set witness count and minimum consensus percentage
  .setFees(WitnetSLA.witnessReward, WitnetSLA.witnessCommitFee) // Set witness reward and witness commit fee
  .setCollateral(WitnetSLA.witnessCollateral) // Set witness collateral

// Do not forget to export the request object
export { request as default }

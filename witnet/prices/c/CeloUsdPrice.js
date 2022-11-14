import * as Witnet from "witnet-requests"

// Retrieve CELO/USD price from Bittrex
const bittrex = new Witnet.Source("https://api.bittrex.com/v3/markets/CELO-USD/ticker")
  .parseJSONMap()
  .getFloat("lastTradeRate")
  .multiply(10 ** 6)
  .round()

// Retrieve CGLD/USD-6 exchange rate from Coinbase
const coinbase = new Witnet.Source("https://api.coinbase.com/v2/exchange-rates?currency=USD")
  .parseJSONMap()
  .getMap("data")
  .getMap("rates")
  .getFloat("CGLD")
  .power(-1)
  .multiply(10 ** 6)
  .round()

// Retrieve CELO/USD-6 price from OKcoin
const okcoin = new Witnet.Source("https://www.okcoin.com/api/spot/v3/instruments/CELO-USD/ticker")
  .parseJSONMap()
  .getFloat("last")
  .multiply(10 ** 6)
  .round()

// Retrieves CELO/USD-6 from the OkEx API (derived from USDT/USD exchange rate)
const okex = new Witnet.Source("https://www.okx.com/api/v5/market/ticker?instId=CELO-USDT")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getArray("data") // Access to the `Map` object at `data` key
  .getMap(0)
  .getFloat("last") // Get the `Float` value associated to the `last` key
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
  .addSource(bittrex)
  .addSource(coinbase)
  .addSource(okcoin)
  .addSource(okex)
  .setAggregator(aggregator) // Set the aggregator function
  .setTally(tally) // Set the tally function
  .setQuorum(10, 51) // Set witness count and minimum consensus percentage
  .setFees(10 ** 6, 10 ** 6) // Set economic incentives
  .setCollateral(5 * 10 ** 9) // Require 5 wits as collateral

// Do not forget to export the request object
export { request as default }

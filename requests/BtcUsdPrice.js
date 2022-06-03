import * as Witnet from "witnet-requests"

// Retrieve BTCUSD price from Binance
const binance = new Witnet.Source("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT")
  .parseJSONMap()
  .getFloat("price")
  .multiply(10 ** 6)
  .round()

// Retrieve BTCUSD price from Bitfinex
const bitfinex = new Witnet.Source("https://api.bitfinex.com/v1/pubticker/btcusd")
  .parseJSONMap()
  .getFloat("last_price")
  .multiply(10 ** 6)
  .round()

// Retrieve BTCUSD price from Kraken
const kraken = new Witnet.Source("https://api.kraken.com/0/public/Ticker?pair=BTCUSD")
  .parseJSONMap()
  .getMap("result")
  .getMap("XXBTZUSD")
  .getArray("a")
  .getFloat(0)
  .multiply(10 ** 6)
  .round()

// Retrieve BTC/USD-6 price from Bittrex
const bittrex = new Witnet.Source("https://api.bittrex.com/v3/markets/BTC-USD/ticker")
  .parseJSONMap()
  .getFloat("lastTradeRate")
  .multiply(10 ** 6)
  .round()
  .multiply(10 ** 6)
  .round()

// Retrieve BTCUSD price from Bittrex
const bittrex = new Witnet.Source("https://api.bittrex.com/api/v1.1/public/getticker?market=USD-BTC")
  .parseJSONMap()
  .getMap("result")
  .getFloat("Last")
  .multiply(10 ** 6)
  .round()

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
  .addSource(binance)
  .addSource(bitfinex)
  .addSource(kraken)
  .addSource(bitstamp)
  .addSource(bittrex)
  .setAggregator(aggregator) // Set the aggregator function
  .setTally(tally) // Set the tally function
  .setQuorum(10, 70) // Set witness count and minimum consensus percentage
  .setFees(10 ** 6, 10 ** 6) // Set economic incentives
  .setCollateral(5 * 10 ** 9) // Require 5 wits as collateral

// Do not forget to export the request object
export { request as default }

import * as Witnet from "witnet-requests"

// Retrieve SOL/USD-6 price from Coinbase
const coinbase = new Witnet.Source("https://api.coinbase.com/v2/exchange-rates?currency=USD")
  .parseJSONMap()
  .getMap("data")
  .getMap("rates")
  .getFloat("SOL")
  .power(-1)
  .multiply(10 ** 6)
  .round()

// Retrieve SOL/USD-6 price from Kraken
const kraken = new Witnet.Source("https://api.kraken.com/0/public/Ticker?pair=SOLUSD")
  .parseJSONMap()
  .getMap("result")
  .getMap("SOLUSD")
  .getArray("a")
  .getFloat(0)
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
  .addSource(coinbase)
  .addSource(kraken)
  .setAggregator(aggregator) // Set the aggregator function
  .setTally(tally) // Set the tally function
  .setQuorum(10, 51) // Set witness count and minimum consensus percentage
  .setFees(15 * 10 ** 7, 10 ** 7) // Witnessing fee: 0.1 wit; Commit/Reveal fee: 0.01 wit;
  .setCollateral(15 * 10 ** 8) // Require 5 wits as collateral

// Do not forget to export the request object
export { request as default }
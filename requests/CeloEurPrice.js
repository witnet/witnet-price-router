import * as Witnet from "witnet-requests"
import { REDUCERS } from "witnet-requests/dist/radon/types"

// Retrieve CGLD/EUR exchange rate from Coinbase
const coinbase = new Witnet.Source("https://api.coinbase.com/v2/exchange-rates?currency=EUR")
  .parseJSONMap()
  .getMap("data")
  .getMap("rates")
  .getFloat("CGLD")
  .power(-1)
  .multiply(10 ** 6)
  .round()

// Retrieve CELO/EUR last price from Bittrex
const bittrex = new Witnet.Source("https://api.bittrex.com/api/v1.1/public/getticker?market=EUR-CELO")
  .parseJSONMap()
  .getMap("result")
  .getFloat("Last")
  .multiply(10 ** 6)
  .round()

// Retrieves CELO/EUR last price form LCX
const lcx = new Witnet.Source("https://exchange-api.lcx.com/market/tickers")
  .parseJSONMap() // Parse a `Map` from the retrieved `String`
  .getMap("data") // Access to the `Map` object at `data` key
  .getMap("CELO/EUR")
  .getFloat("lastPrice") // Get the `Float` value associated to the `last` key
  .multiply(10 ** 6) // Use 6 digit precision
  .round() // Cast to integer

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
  .addSource(coinbase)
  .addSource(bittrex)
  .addSource(lcx)
  .setAggregator(aggregator) // Set the aggregator function
  .setTally(tally) // Set the tally function
  .setQuorum(10, 70) // Set witness count and minimum consensus percentage
  .setFees(10 ** 6, 10 ** 6) // Set economic incentives
  .setCollateral(5 * 10 ** 9) // Require 5 wits as collateral

// Do not forget to export the request object
export { request as default }

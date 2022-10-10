import * as Witnet from "witnet-requests"

// Retrieve KSP/KRW-6 price from the Korbit HTTP-GET API
const korbit = new Witnet.Source("https://api.korbit.co.kr/v1/ticker/detailed?currency_pair=ksp_krw")
  .parseJSONMap()
  .getFloat("last")
  .multiply(10 ** 3)

// Retrieve KSP/KRW-6 price from the Coinone HTTP-GET API
const coinone = new Witnet.Source("https://api.coinone.co.kr/public/v2/ticker_new/krw/ksp")
  .parseJSONMap()
  .getArray("tickers")
  .getMap(0)
  .getFloat("last")
  .multiply(10 ** 3)
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
  .addSource(korbit)
  .addSource(coinone)
  .setAggregator(aggregator) // Set the aggregator function
  .setTally(tally) // Set the tally function
  .setQuorum(10, 51) // Set witness count and minimum consensus percentage
  .setFees(10 ** 6, 10 ** 6) // Set economic incentives
  .setCollateral(5 * 10 ** 9) // Require 5 wits as collateral

// Do not forget to export the request object
export { request as default }

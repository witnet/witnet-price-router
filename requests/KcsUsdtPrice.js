import * as Witnet from "witnet-requests"

// Retrieves USDT price of KCC from KUCOIN API
const kucoin = new Witnet.Source("https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=KCS-USDT")
  .parseJSONMap() 
  .getMap("data")
  .getFloat("price")
  .multiply(10 ** 6)
  .round()

// Retrieves USDT price of KCC from PROBIT API
const probit = new Witnet.Source("https://api.probit.com/api/exchange/v1/ticker?market_ids=KCS-USDT")
  .parseJSONMap()
  .getArray("data")
  .getMap(0)
  .getFloat("last")
  .multiply(10 ** 6)
  .round()

// Retrieves USDT price of KCC from 1INCH API
const inch = new Witnet.Source("https://api.1inch.exchange/v3.0/1/quote?fromTokenAddress=0xf34960d9d60be18cc1d5afc1a6f012a723a28811&toTokenAddress=0xdac17f958d2ee523a2206206994597c13d831ec7&amount=1000000")
  .parseJSONMap() 
  .getFloat("toTokenAmount")
  .round()

// Retrieves USDT price of METIS from the HOTBIT API
const bitmax = new Witnet.Source("https://ascendex.com/api/pro/v1/spot/ticker?symbol=KCS/USDT")
  .parseJSONMap()
  .getMap("data")
  .getFloat("close")
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
  .addSource(kucoin)
  .addSource(probit)
  .addSource(inch)
  .addSource(bitmax)
  .setAggregator(aggregator) // Set the aggregator function
  .setTally(tally) // Set the tally function
  .setQuorum(10, 51) // Set witness count and minimum consensus percentage
  .setFees(10 ** 6, 10 ** 6) // Set economic incentives
  .setCollateral(5 * 10 ** 9) // Require 5 wits as collateral

// Do not forget to export the request object
export { request as default }

import * as Witnet from "witnet-requests"
import * as WitnetSLA from "../../../../../migrations/witnet-slas"

// Retrieve KRW/USD-9 price from the ExchangeRateHost HTTP-GET API
const exchangeratehost = new Witnet.Source("https://api.exchangerate.host/latest?base=KRW&symbols=USD")
  .parseJSONMap()
  .getMap("rates")
  .getFloat("USD")
  .multiply(10 ** 9)
  .round()

// Retrieve KRW/USD-9 price from the FreeForexAPI HTTP-GET API
const freeforexapi = new Witnet.Source("https://www.freeforexapi.com/api/live?pairs=USDKRW")
  .parseJSONMap()
  .getMap("rates")
  .getMap("USDKRW")
  .getFloat("rate")
  .power(-1)
  .multiply(10 ** 9)
  .round()

// Retrieve KRW/USD-9 price from the FastForex HTTP-GET API
const fastforex = new Witnet.Source("https://api.fastforex.io/fetch-one?from=KRW&to=USD&api_key=demo")
  .parseJSONMap()
  .getMap("result")
  .getFloat("USD")
  .multiply(10 ** 9)
  .round()

// Retrieve KRW/USD-9 price from the Currency-Api HTTP-GET API
const currencyapi = new Witnet.Source("https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/krw.json")
  .parseJSONMap()
  .getMap("krw")
  .getFloat("usd")
  .multiply(10 ** 9)
  .round()

// Retrieve KRW/USD-9 price from the LiveRates HTTP-GET API
const liverates = new Witnet.Source("https://www.live-rates.com/rates")
  .parseJSONArray()
  .filter(
    new Witnet.Script([Witnet.TYPES.MAP])
      .getString("currency")
      .match({ "USD/KRW": true }, false)
  )
  .getMap(0)
  .getFloat("rate")
  .power(-1)
  .multiply(10 ** 9)
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
  .addSource(exchangeratehost)
  // .addSource(freeforexapi)
  .addSource(fastforex)
  .addSource(currencyapi)
  // .addSource(liverates)
  .setAggregator(aggregator) // Set the aggregator function
  .setTally(tally) // Set the tally function
  .setQuorum(WitnetSLA.numWitnesses, WitnetSLA.witnessingQuorum) // Set witness count and minimum consensus percentage
  .setFees(WitnetSLA.witnessReward, WitnetSLA.witnessCommitFee) // Set witness reward and witness commit fee
  .setCollateral(WitnetSLA.witnessCollateral) // Set witness collateral

// Do not forget to export the request object
export { request as default }

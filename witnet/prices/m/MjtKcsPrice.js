import * as Witnet from "witnet-requests"

// Retrieves USDT price of KCS from KUCOIN API
const kucoin = new Witnet.Source("https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=MJT-KCS")
  .parseJSONMap() 
  .getMap("data")
  .getFloat("price")
  .multiply(10 ** 9)
  .round()

// Retrieve MJT/KCS-9 from MOJITO SWAP
const mojito = new Witnet.GraphQLSource(
    "https://thegraph.kcc.network/subgraphs/name/mojito/swap",
    `{
      pair (id:"0xa0d7c8aa789362cdf4faae24b9d1528ed5a3777f") {
        token1Price
      }
    }`,
  )
  .parseJSONMap()
  .getMap("data")
  .getMap("pair")
  .getFloat("token1Price")
  .multiply(10 ** 9)
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
  .addSource(kucoin)
  .addSource(mojito)
  .setAggregator(aggregator)
  .setTally(tally) // Set the tally function
  .setQuorum(10, 51) // Set witness count and minimum consensus percentage
  .setFees(15 * 10 ** 7, 10 ** 7) // Witnessing fee: 0.1 wit; Commit/Reveal fee: 0.01 wit;
  .setCollateral(15 * 10 ** 8) // Require 5 wits as collateral

// Do not forget to export the request object
export { request as default }

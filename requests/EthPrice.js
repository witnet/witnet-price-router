import * as Witnet from "witnet-requests"

// Retrieves USD price of a eth from the BitStamp API
const bitstamp = new Witnet.Source("https://www.bitstamp.net/api/v2/ticker/ethusd/")
  .parseMapJSON() // Parse a `Map` from the retrieved `String`
  .getFloat("last") // Get the `Float` value associated to the `last` key
  .multiply(1000)
  .round()


// Filters out any value that is more than 1.5 times the standard
// deviationaway from the average, then computes the average mean of the
// values that pass the filter.
const aggregator = new Witnet.Aggregator({
    filters: [
      [ Witnet.Types.FILTERS.deviationStandard, 1.5 ],
    ],
    reducer: Witnet.Types.REDUCERS.averageMean,
  })
  
  // Filters out any value that is more than 1.5 times the standard
  // deviationaway from the average, then computes the average mean of the
  // values that pass the filter.
  const tally = new Witnet.Tally({
    filters: [
      [ Witnet.Types.FILTERS.deviationStandard, 1.0 ],
    ],
    reducer: Witnet.Types.REDUCERS.averageMean,
  })
  
  // This is the Witnet.Request object that needs to be exported
  const request = new Witnet.Request()
    .addSource(bitstamp) // Use source 1
    .setAggregator(aggregator) // Set the aggregator function
    .setTally(tally) // Set the tally function
    .setQuorum(4, 1, 2, 5, 70) // Set witness count
    .setFees(10, 1, 1, 1) // Set economic incentives
    .schedule(0) // Make this request immediately solvable
  
  // Do not forget to export the request object
  export { request as default }

  
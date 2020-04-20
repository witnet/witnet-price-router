import * as Witnet from "witnet-requests"

const coinyep = new Witnet.Source("https://coinyep.com/api/v1/?from=XAU&to=EUR&lang=es&format=json")
  .parseMapJSON() // Parse a Map from the retrieved String
  .getFloat("price") // Get the Map value associated to the price key
  .multiply(1000)
  .round()

const dataasg = new Witnet.Source("https://data-asg.goldprice.org/dbXRates/EUR")
  .parseMapJSON()
  .getArray("items")
  .getMap(0)
  .getFloat("xauPrice")
  .multiply(1000)
  .round()

const mycurrencytransfer = new Witnet.Source("https://www.mycurrencytransfer.com/api/current/XAU/EUR")
  .parseMapJSON()
  .getMap("data")
  .getFloat("rate")
  .multiply(1000)
  .round()

const inversoro = new Witnet.Source("https://www.inversoro.es/datos/?period=3year&xignite_code=XAU&currency=EUR&weight_unit=ounces")
  .parseMapJSON()
  .getMap("table_data")
  .getFloat("metal_price_current")
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
  .addSource(coinyep) // Use source 1
  .addSource(dataasg) // Use source 2
  .addSource(mycurrencytransfer) // Use source 3
  .addSource(inversoro) // Use source 4
  .setAggregator(aggregator) // Set the aggregator function
  .setTally(tally) // Set the tally function
  .setQuorum(4, 1, 2, 5, 70) // Set witness count
  .setFees(10, 1, 1, 1) // Set economic incentives
  .schedule(0) // Make this request immediately solvable

// Do not forget to export the request object
export { request as default }
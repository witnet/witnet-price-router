const exec = require("child_process").execSync
const queries = require("../migrations/witnet-queries")
const captions = Object.keys(queries)

contract("Witnet Queries", () => {
  describe("No errors on dry run", () => {
    captions.forEach(key => {
      const bytecode = queries[key]?.bytecode
      if (bytecode) {
        it(key, () => {
          const errors = exec(
            `npx witnet-toolkit try-query --hex ${
              bytecode
            } | grep Error | wc -l`
          ).toString().split("\n")[0]
          if (errors !== "0") {
            throw exec(
              `npx witnet-toolkit try-query --hex ${
                bytecode
              } | grep Error`
            ).toString()
          }
        })
      }
    })
  })
})

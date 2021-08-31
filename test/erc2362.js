require("dotenv").config()
const truffleAssert = require("truffle-assertions")

const realm = process.env.WITNET_EVM_REALM.toLowerCase() || "default"
const settings = require("../migrations/erc2362.settings")

const ERC2362PriceFeed = artifacts.require(
  settings.artifacts[realm]
    ? settings.artifacts[realm].ERC2362PriceFeed
    : settings.artifacts.default.ERC2362PriceFeed
)
const WitnetRequestBoard = artifacts.require("WitnetRequestBoard")
const WitnetRequestBoardTestHelper = artifacts.require("WitnetRequestBoardTestHelper")

const decimals = 3
const ERC2362ID = "Price-BTC/USD-3"
// eslint-disable-next-line
const bytecode = "0x0abf0108b9d8cf8806123b122468747470733a2f2f7777772e6269747374616d702e6e65742f6170692f7469636b65722f1a13841877821864646c6173748218571903e8185b125c123168747470733a2f2f6170692e636f696e6465736b2e636f6d2f76312f6270692f63757272656e7470726963652e6a736f6e1a2786187782186663627069821866635553448218646a726174655f666c6f61748218571903e8185b1a0d0a0908051205fa3fc000001003220d0a0908051205fa3fc000001003100a186420012846308094ebdc03"

contract(ERC2362PriceFeed.contractName, accounts => {
  describe("WRB test suite", () => {
    let feed, maxReward
    let wrbInstance

    before(async () => {
      const helper = await WitnetRequestBoardTestHelper.new()
      wrbInstance = await WitnetRequestBoard.at(helper.address)
    })

    beforeEach(async () => {
      maxReward = web3.utils.toWei("0.1", "ether")
      feed = await ERC2362PriceFeed.new(
        wrbInstance.address,
        ERC2362ID,
        decimals,
        ...(
          settings.constructorParams[realm]
            ? settings.constructorParams[realm].ERC2362PriceFeed
            : settings.constructorParams.default.ERC2362PriceFeed
        )
      )
      await feed.initialize(bytecode)
    })

    it("completes the flow with a correct result", async () => {
      await feed.requestUpdate({ value: maxReward })
      const id = await feed.requestId()
      await wrbInstance.reportResult(id, "0xAA", "0x1b0020000000000000")
      await feed.completeUpdate()
      const value = await feed.valueFor(await feed.erc2362ID.call())

      assert.equal(web3.utils.toHex(await feed.lastPrice()), 0x3f2)
      assert.equal(await feed.pending(), false)
      assert.equal(value[0], 0x3f2)
      assert.notEqual(value[1], 0)
      assert.equal(value[2], 200)
    })

    it("log an event if errored CBOR decoding", async () => {
      await feed.requestUpdate({ value: maxReward })
      const id = await feed.requestId()
      const expectedError = "mock error"

      // This error message triggers a revert when reading it asErrorMessage
      await wrbInstance.reportResult(id, "0xAA", "0x")
      const tx = await feed.completeUpdate()
      // check emission of the event and its message correctness
      const event = tx.receipt.rawLogs.some(l => {
        return web3.utils.hexToAscii(l.data.toString()).includes(expectedError)
      })
      // As we are emiting a string event of bytes that are not in UTF8 format, truffle asserts doesn't detect it
      // In this case, we should check the rawLogs directly
      assert(event)
      assert.equal(await feed.pending(), false)
    })

    it("reverts when result not ready", async () => {
      await feed.requestUpdate({ value: maxReward })
      const expectedError = "request not solved"
      // should fail to fetch the result
      await truffleAssert.reverts(
        feed.completeUpdate(),
        expectedError
      )
      assert.equal(await feed.pending(), true)
    })

    it("reverts when a DR is already pending", async () => {
      await feed.requestUpdate({ value: maxReward })
      const expectedError = "pending update"
      // should fail to insert another DR
      await truffleAssert.reverts(
        feed.requestUpdate({ value: maxReward }),
        expectedError
      )
      assert.equal(await feed.pending(), true)
    })

    it("should fetch 0, 0, 400 if fetching value for non-correct ID", async () => {
      const value = await feed.valueFor("0xAA")
      assert.equal(value[0], 0)
      assert.equal(value[1], 0)
      assert.equal(value[2], 400)
    })

    it("should fetch 0, 0, 404 if no update has completed yet", async () => {
      const value = await feed.valueFor(await feed.erc2362ID.call())
      assert.equal(value[0], 0)
      assert.equal(value[1], 0)
      assert.equal(value[2], 404)
    })
  })
})

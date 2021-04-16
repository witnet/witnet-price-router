const WRB = artifacts.require("WitnetRequestBoard")
const WRBproxy = artifacts.require("WitnetRequestBoardProxy")
const ethFeed = artifacts.require("EthUsdPriceFeed")
const Witnet = artifacts.require("Witnet")

const truffleAssert = require("truffle-assertions")

contract("EthUsdPriceFeed", accounts => {
  describe("WRB test suite", () => {
    let witnet, wrbInstance, wrbProxy, feed
    const reward = web3.utils.toWei("1", "ether")
    beforeEach(async () => {
      witnet = await Witnet.new()
      wrbInstance = await WRB.new([accounts[0]])
      wrbProxy = await WRBproxy.new(wrbInstance.address, {
        from: accounts[0],
      })
      await ethFeed.link(Witnet, witnet.address)
      feed = await ethFeed.new(wrbProxy.address)
    })

    it("completes the flow with a correct result", async () => {
      await feed.requestUpdate({ value: reward })
      const id = await feed.lastRequestId()

      await wrbInstance.reportResult(id, "0xAA", "0x1b0020000000000000")
      await feed.completeUpdate()
      const value = await feed.valueFor("0xdfaa6f747f0f012e8f2069d6ecacff25f5cdf0258702051747439949737fc0b5")

      assert.equal(web3.utils.toHex(await feed.lastPrice()), 0x20000000000000)
      assert.equal(await feed.pending(), false)
      assert.equal(value[0], 0x20000000000000)
      assert.notEqual(value[1], 0)
      assert.equal(value[2], 200)
    })

    it("log an event if errored CBOR decoding", async () => {
      await feed.requestUpdate({ value: reward })
      const id = await feed.lastRequestId()
      const expectedError = "Tried to read `uint64` from a `CBOR.Value` with majorType != 0"

      // This error message triggers a revert when reading it asErrorMessage
      await wrbInstance.reportResult(id, "0xAA", "0xD827831851F93800FB3FE6666666666666")
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
      await feed.requestUpdate({ value: reward })
      const expectedError = "Witnet request is not yet resolved by the Witnet network"

      // should fail to fetch the result
      await truffleAssert.reverts(
        feed.completeUpdate(), expectedError)

      assert.equal(await feed.pending(), true)
    })

    it("reverts when a DR is already pending", async () => {
      await feed.requestUpdate({ value: reward })
      const expectedError = "Complete pending request before requesting a new one"

      // should fail to insert another DR
      await truffleAssert.reverts(
        feed.requestUpdate({ value: reward }), expectedError)

      assert.equal(await feed.pending(), true)
    })

    it("should fetch 0, 0, 400 if fetching value for non-correct ID", async () => {
      const value = await feed.valueFor("0xAA")

      assert.equal(value[0], 0)
      assert.equal(value[1], 0)
      assert.equal(value[2], 400)
    })

    it("should fetch 0, 0, 404 if no update has completed yet", async () => {
      const value = await feed.valueFor("0xdfaa6f747f0f012e8f2069d6ecacff25f5cdf0258702051747439949737fc0b5")

      assert.equal(value[0], 0)
      assert.equal(value[1], 0)
      assert.equal(value[2], 404)
    })
  })
})

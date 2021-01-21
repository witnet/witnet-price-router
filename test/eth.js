const WRB = artifacts.require("MockWitnetRequestsBoard")
const WRBproxy = artifacts.require("WitnetRequestsBoardProxy")
const ethFeed = artifacts.require("EthUsdPriceFeed")
const Witnet = artifacts.require("Witnet")

const truffleAssert = require("truffle-assertions")

contract("EthUsdPriceFeed", accounts => {
  describe("WRB test suite", () => {
    let wrbInstance
    let wrbProxy
    let feed
    const gasPrice = 20000
    const requestPrice = web3.utils.toWei("0.0003", "ether")
    beforeEach(async () => {  
      witnet = await Witnet.new()
      wrbInstance = await WRB.new()
      wrbProxy = await WRBproxy.new(wrbInstance.address, {
        from: accounts[0],
      })
      await ethFeed.link(Witnet, witnet.address)
      feed = await ethFeed.new(wrbProxy.address)
    })

    it("completes the flow with a correct result", async () => {
      let rewards = await feed.estimateGasCost.call(gasPrice)
      await feed.requestUpdate(rewards[0], rewards[1], rewards[2], {value: rewards[0].add(rewards[1].add(rewards[2])), gasPrice: gasPrice})
      id = await feed.lastRequestId()
      await wrbInstance.reportDrHash(id, "0xAA")
  
      await wrbInstance.reportResult(id, "0x1b0020000000000000")
      let tx = await feed.completeUpdate()
      let value = await feed.valueFor("0xdfaa6f747f0f012e8f2069d6ecacff25f5cdf0258702051747439949737fc0b5")

      assert.equal(web3.utils.toHex(await feed.lastPrice()), 0x20000000000000)
      assert.equal(await feed.pending(), false)
      assert.equal(value[0], 0x20000000000000)
      assert.notEqual(value[1], 0)
      assert.equal(value[2], 200)
    })

    it("log an event if errored CBOR decoding", async () => {
      let rewards = await feed.estimateGasCost.call(gasPrice)
      await feed.requestUpdate(rewards[0], rewards[1], rewards[2], {value: rewards[0].add(rewards[1].add(rewards[2])), gasPrice: gasPrice})
      id = await feed.lastRequestId()
      let expectedError = 'Tried to read `uint64` from a `CBOR.Value` with majorType != 0'
      await wrbInstance.reportDrHash(id, "0xAA")

      // This error message triggers a revert when reading it asErrorMessage
      await wrbInstance.reportResult(id, "0xD827831851F93800FB3FE6666666666666")
      let tx = await feed.completeUpdate()
      // check emission of the event and its message correctness
      let event = tx.receipt.rawLogs.some(l => {
        return web3.utils.hexToAscii(l.data.toString()).includes(expectedError)
      })
      // As we are emiting a string event of bytes that are not in UTF8 format, truffle asserts doesn't detect it
      // In this case, we should check the rawLogs directly
      assert(event)
      assert.equal(await feed.pending(), false)
    })

    it("reverts when result not ready", async () => {
      let rewards = await feed.estimateGasCost.call(gasPrice)
      await feed.requestUpdate(rewards[0], rewards[1], rewards[2], {value: rewards[0].add(rewards[1].add(rewards[2])), gasPrice: gasPrice})
      let expectedError = 'Found empty buffer when parsing CBOR value'
      await wrbInstance.reportDrHash(id, "0xAA")
  
      // should fail to fetch the result
      await truffleAssert.reverts(
      feed.completeUpdate(), expectedError)

      assert.equal(await feed.pending(), true)
    })

    it("reverts when a DR is already pending", async () => {
      let rewards = await feed.estimateGasCost.call(gasPrice)
      await feed.requestUpdate(rewards[0], rewards[1], rewards[2], {value: rewards[0].add(rewards[1].add(rewards[2])), gasPrice: gasPrice})
      let expectedError = 'An update is already pending'
  
      // should fail to insert another DR
      await truffleAssert.reverts(
      feed.requestUpdate(rewards[0], rewards[1], rewards[2], {value: rewards[0].add(rewards[1].add(rewards[2])), gasPrice: gasPrice}), expectedError)

      assert.equal(await feed.pending(), true)
    })

    it("reverts when rewards do not cover Gas Costs", async () => {
      let rewards = await feed.estimateGasCost.call(gasPrice-1)
      let expectedError = 'The rewards do not cover gas expenses for bridge nodes. You can get an estimate of these rewards by calling the estimateGasCost function'
  
      // should fail to insert another DR
      await truffleAssert.reverts(
      feed.requestUpdate(rewards[0], rewards[1], rewards[2], {value: rewards[0].add(rewards[1].add(rewards[2])), gasPrice: gasPrice}), expectedError)
    })

    it("should fetch 0, 0, 400 if fetching value for non-correct ID", async () => {
      let value = await feed.valueFor("0xAA")

      assert.equal(value[0], 0)
      assert.equal(value[1], 0)
      assert.equal(value[2], 400)
    })

    it("should fetch 0, 0, 404 if no update has completed yet", async () => {
        let value = await feed.valueFor("0xdfaa6f747f0f012e8f2069d6ecacff25f5cdf0258702051747439949737fc0b5")

        assert.equal(value[0], 0)
        assert.equal(value[1], 0)
        assert.equal(value[2], 404)
    })

  })

})
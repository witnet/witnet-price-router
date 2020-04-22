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
        const halfEther = web3.utils.toWei("0.5", "ether")
        await feed.requestUpdate({value: halfEther})
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
      const halfEther = web3.utils.toWei("0.5", "ether")
      await feed.requestUpdate({value: halfEther})
      id = await feed.lastRequestId()
      let expectedError = 'Tried to read `uint64` from a `CBOR.Value` with majorType != 0'
      await wrbInstance.reportDrHash(id, "0xAA")

      // This error message triggers a rever when reading it asErrorMessage
      await wrbInstance.reportResult(id, "0xD827831851F93800FB3FE6666666666666")
      let tx = await feed.completeUpdate()
      // check emission of the event and its message correctness
      truffleAssert.eventEmitted(tx, "resultError", (ev) => {
        return ev[0].toString().includes(expectedError)
      })

      assert.equal(await feed.pending(), false)
    })

    it("reverts when result not ready", async () => {
        const halfEther = web3.utils.toWei("0.5", "ether")
        await feed.requestUpdate({value: halfEther})
        let expectedError = 'Found empty buffer when parsing CBOR value'
        await wrbInstance.reportDrHash(id, "0xAA")
  
         // should fail to fetch the result
        await truffleAssert.reverts(
        feed.completeUpdate(), expectedError)

        assert.equal(await feed.pending(), true)
    })

    it("reverts when a DR is already pending", async () => {
        const halfEther = web3.utils.toWei("0.5", "ether")
        await feed.requestUpdate({value: halfEther})
        let expectedError = 'An update is already pending'
  
        // should fail to insert another DR
        await truffleAssert.reverts(
        feed.requestUpdate({value: halfEther}), expectedError)

        assert.equal(await feed.pending(), true)
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
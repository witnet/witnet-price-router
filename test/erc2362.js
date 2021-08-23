require("dotenv").config()
const truffleAssert = require("truffle-assertions")

const realm = process.env.WITNET_EVM_REALM ? process.env.WITNET_EVM_REALM.toLowerCase() : "default"
const addresses = require("../migrations/addresses")[realm]
const settings = require("../migrations/erc2362.settings")

const Witnet = artifacts.require("Witnet")
const WitnetProxy = artifacts.require("WitnetProxy")
const WitnetRequestBoard = artifacts.require("WitnetRequestBoard")
const ERC2362PriceFeed = artifacts.require(
  settings.artifacts[realm].ERC2362PriceFeed ||
      settings.artifacts.default.ERC2362PriceFeed
)

if (!addresses.test) {
  console.error(
    "Info: unitary tests for '" + ERC2362PriceFeed.contractName + "'",
    "can only run against externally provided networks.\n"
  )
  process.exit(0)
}

console.log(`Using Witnet addresses in network '${realm}:test':`)
console.log(addresses.test)

Witnet.address = addresses.test.Witnet
WitnetProxy.address = addresses.test.WitnetProxy
ERC2362PriceFeed.link(Witnet, Witnet.address)

const witnetScriptERC2362ID = "Price-BTC/USD-3"
// eslint-disable-next-line
const witnetScriptBytecode = "0x0abf0108b9d8cf8806123b122468747470733a2f2f7777772e6269747374616d702e6e65742f6170692f7469636b65722f1a13841877821864646c6173748218571903e8185b125c123168747470733a2f2f6170692e636f696e6465736b2e636f6d2f76312f6270692f63757272656e7470726963652e6a736f6e1a2786187782186663627069821866635553448218646a726174655f666c6f61748218571903e8185b1a0d0a0908051205fa3fc000001003220d0a0908051205fa3fc000001003100a186420012846308094ebdc03"

contract(ERC2362PriceFeed.contractName, accounts => {
  describe("WRB test suite", () => {
    let feed, reward
    let wrbInstance

    beforeEach(async () => {
      wrbInstance = await WitnetRequestBoard.at(WitnetProxy.address)
      reward = await wrbInstance.estimateGasCost.call(web3.utils.toWei("1", "gwei"))
      feed = await ERC2362PriceFeed.new(
        wrbInstance.address,
        witnetScriptERC2362ID,
        ...(
          settings.constructorParams[realm].ERC2362PriceFeed ||
              settings.constructorParams.default.ERC2362PriceFeed
        )
      )
      await feed.setWitnetScriptBytecode(witnetScriptBytecode)
    })

    // TODO: make WitnetRequestBoard inherit from 'IWitnetBridgeReporter'
    // it("completes the flow with a correct result", async () => {
    //   await feed.requestUpdate({ value: reward })
    //   const id = await feed.lastRequestId()
    //   await wrbInstance.reportResult(id, "0xAA", "0x1b0020000000000000")
    //   await feed.completeUpdate()
    //   const value = await feed.valueFor("0xdfaa6f747f0f012e8f2069d6ecacff25f5cdf0258702051747439949737fc0b5")

    //   assert.equal(web3.utils.toHex(await feed.lastPrice()), 0x20000000000000)
    //   assert.equal(await feed.pending(), false)
    //   assert.equal(value[0], 0x20000000000000)
    //   assert.notEqual(value[1], 0)
    //   assert.equal(value[2], 200)
    // })

    // TODO: make WitnetRequestBoard inherit from 'IWitnetBridgeReporter'
    // it("log an event if errored CBOR decoding", async () => {
    //   await feed.requestUpdate({ value: reward })
    //   const id = await feed.lastRequestId()
    //   const expectedError = "Tried to read `uint64` from a `CBOR.Value` with majorType != 0"

    //   // This error message triggers a revert when reading it asErrorMessage
    //   await wrbInstance.reportResult(id, "0xAA", "0xD827831851F93800FB3FE6666666666666")
    //   const tx = await feed.completeUpdate()
    //   // check emission of the event and its message correctness
    //   const event = tx.receipt.rawLogs.some(l => {
    //     return web3.utils.hexToAscii(l.data.toString()).includes(expectedError)
    //   })
    //   // As we are emiting a string event of bytes that are not in UTF8 format, truffle asserts doesn't detect it
    //   // In this case, we should check the rawLogs directly
    //   assert(event)
    //   assert.equal(await feed.pending(), false)
    // })

    it("reverts when result not ready", async () => {
      await feed.requestUpdate({ value: reward })
      // const expectedError = "Witnet request is not yet resolved by the Witnet network"

      // should fail to fetch the result
      await truffleAssert.reverts(
        feed.completeUpdate(),
        ""// expectedError
      )

      assert.equal(await feed.pending(), true)
    })

    it("reverts when a DR is already pending", async () => {
      await feed.requestUpdate({ value: reward })
      // const expectedError = "Complete pending request before requesting a new one"

      // should fail to insert another DR
      await truffleAssert.reverts(
        feed.requestUpdate({ value: reward }),
        ""// expectedError
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

pragma solidity ^0.6.4;
pragma experimental ABIEncoderV2;

// Import the UsingWitnet library that enables interacting with Witnet
import "witnet-ethereum-bridge/contracts/UsingWitnet.sol";
// Import the ERC2362 interface
import "adomedianizer/contracts/IERC2362.sol";
// Import the goldPrice request that you created before
import "../requests/GoldPrice.sol";

// Your contract needs to inherit from UsingWitnet
contract PriceFeed is UsingWitnet, IERC2362 {

  // The public gold price point
  uint64 public goldPrice;

  // Stores the ID of the last Witnet request
  uint256 public lastRequestId;

  // Stores the timestamp of the last time the public price point was updated
  uint256 public timestamp;

  // Tells if an update has been requested but not yet completed
  bool public pending;

  // The Witnet request object, is set in the constructor
  Request public request;

  // Emits when the price is updated
  event priceUpdated(uint64);

  // Emits when found an error decoding request result
  event resultError(string);

  // This is the ERC2362 identifier for a gold price feed, computed as `keccak256("Price-XAU/EUR-3")`
  bytes32 constant public XAUEUR3ID = bytes32(hex"68cba0705475e40c1ddbf7dc7c1ae4e7320ca094c4e118d1067c4dea5df28590");

  // This constructor does a nifty trick to tell the `UsingWitnet` library where
  // to find the Witnet contracts on whatever Ethereum network you use.
  constructor (address _wrb) UsingWitnet(_wrb) public {
    // Instantiate the Witnet request
    request = new GoldPriceRequest();
  }

  function requestUpdate() public payable {
    require(!pending, "An update is already pending. Complete it first before requesting another update.");

    // Amount to pay to the bridge node relaying this request from Ethereum to Witnet
    uint256 _witnetRequestReward = 100 szabo;
    // Amount of wei to pay to the bridge node relaying the result from Witnet to Ethereum
    uint256 _witnetResultReward = 100 szabo;

    // Send the request to Witnet and store the ID for later retrieval of the result
    // The `witnetPostRequest` method comes with `UsingWitnet`
    lastRequestId = witnetPostRequest(request, _witnetRequestReward, _witnetResultReward);

    // Signal that there is already a pending request
    pending = true;
  }

  // The `witnetRequestAccepted` modifier comes with `UsingWitnet` and allows to
  // protect your methods from being called before the request has been successfully
  // relayed into Witnet.
  function completeUpdate() public witnetRequestAccepted(lastRequestId) {
    require(pending, "There is no pending update.");

    // Read the result of the Witnet request
    // The `witnetReadResult` method comes with `UsingWitnet`
    Witnet.Result memory result = witnetReadResult(lastRequestId);

    // If the Witnet request succeeded, decode the result and update the price point
    // If it failed, revert the transaction with a pretty-printed error message
    if (result.isOk()) {
      goldPrice = result.asUint64();
      timestamp = block.timestamp;
      emit priceUpdated(goldPrice);
    } else {
      (, string memory errorMessage) = result.asErrorMessage();
      emit resultError(errorMessage);
    }

    // In any case, set `pending` to false so a new update can be requested
    pending = false;
  }

  /**
  * @notice Exposes the public data point in an ERC2362 compliant way.
  * @dev Returns error `400` if queried for an unknown data point, and `404` if `completeUpdate` has never been called
  * successfully before.
  **/
  function valueFor(bytes32 _id) external view override returns(int256, uint256, uint256) {
    // Unsupported data point ID
    if(_id != XAUEUR3ID) return(0, 0, 400);
    // No value is yet available for the queried data point ID
    if (timestamp == 0) return(0, 0, 404);

    int256 value = int256(goldPrice);

    return(value, timestamp, 200);
  }
}
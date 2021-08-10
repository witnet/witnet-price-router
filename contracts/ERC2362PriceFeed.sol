// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;
pragma experimental ABIEncoderV2;

// Implements:
import "witnet-ethereum-bridge/contracts/UsingWitnet.sol";
import "adomedianizer/contracts/interfaces/IERC2362.sol";

// Uses:
import "./utils/WitnetRequestInitializable.sol";

// Required artifacts during migrations or tests:
import "witnet-ethereum-bridge/contracts/WitnetProxy.sol";
import "witnet-ethereum-bridge/contracts/WitnetRequestBoard.sol";

// Your contract needs to inherit from UsingWitnet
contract ERC2362PriceFeed is UsingWitnet, IERC2362 {

  using Witnet for WitnetData.Result;

  /// Creator's address.
  address public immutable creator;

  // The `keccak256` hash of the price feed, according to ERC2362 specs.`
  bytes32 public immutable erc2362ID;

  /// Witnet RADON script used the last time a price update was requested:
  WitnetRequest public radonScript;

  /// Stores the ID of the last Witnet request posting.
  uint256 public lastRequestId;

  /// The last received price point.
  uint64 public lastPrice;

  /// Tells if an update has been requested but not yet completed.
  bool public pending;

  /// Stores the timestamp of the last time the public price point was updated.
  uint256 public timestamp;

  /// Notifies when a new Radon script is set.
  event ScriptBytecodeSet(bytes32 erc2362ID, bytes32 scriptHash);
  
  /// Notifies when the price is updated.
  event PriceUpdated(uint64);

  /// Notifies when found an error decoding request result.
  event ResultError(string);

  WitnetRequestInitializable internal _nextRadonScript;

  /// Constructor.
  /// @param _wrb WitnetRequestBoard instance, or proxy, address.
  /// @param _erc2362id Price feed denomination according to ERC2362 specs.
  constructor (address _wrb, string memory _erc2362id) UsingWitnet(_wrb) {
    creator = msg.sender;
    erc2362ID = keccak256(abi.encodePacked(_erc2362id));
  }

  /// @notice Creates a new WitnetRequest to be used on the next request update, and afterwards.
  /// @param _bytecode Witnet Radon Script, serialized in bytes.
  function setWitnetScriptBytecode(bytes calldata _bytecode)
    external
  {
    require(msg.sender == creator, "ERC2362PriceFeed: only creator");
    _nextRadonScript = new WitnetRequestInitializable();
    _nextRadonScript.initialize(_bytecode);
    emit ScriptBytecodeSet(
      erc2362ID,
      bytes32(WitnetData.computeDataRequestCodehash(_bytecode))
    );
    if (!pending) {
      radonScript = WitnetRequest(_nextRadonScript);
    }
  }

  /// @notice Sends `request` to the WitnetRequestBoard.
  /// @dev This method will only succeed if `pending` is 0.  
  function requestUpdate()
    public payable
    virtual
  {
    require(!pending, "Complete pending request before requesting a new one");

    // Send the request to Witnet and store the ID for later retrieval of the result
    // The `witnetPostRequest` method comes with `UsingWitnet`
    if (address(_nextRadonScript) != address(radonScript)) {
      radonScript = _nextRadonScript;
    }
    lastRequestId = witnetPostRequest(radonScript);

    // Signal that there is already a pending request
    pending = true;
  }

  /// @notice Reads the result, if ready, from the WitnetRequestBoard.
  /// @dev The `witnetRequestAccepted` modifier comes with `UsingWitnet` and allows to
  /// @dev protect your methods from being called before the request has been successfully
  /// @dev relayed into Witnet.
  function completeUpdate()
    public witnetRequestResolved(lastRequestId)
  {
    require(pending, "There is no pending update.");

    // Read the result of the Witnet request
    // The `witnetReadResult` method comes with `UsingWitnet`
    WitnetData.Result memory result = witnetDestroyResult(lastRequestId);

    // If the Witnet request succeeded, decode the result and update the price point
    // If it failed, revert the transaction with a pretty-printed error message
    if (result.isOk()) {
      lastPrice = result.asUint64();
      // solhint-disable-next-line not-rely-on-time
      timestamp = block.timestamp;
      emit PriceUpdated(lastPrice);
    } else {
      string memory errorMessage;
      // Try to read the value as an error message, catch error bytes if read fails
      try result.asErrorMessage() returns (WitnetData.ErrorCodes, string memory e) {
        errorMessage = e;
      }
      catch (bytes memory errorBytes){
        errorMessage = string(errorBytes);
      }
      emit ResultError(errorMessage);
    }

    // In any case, set `pending` to false so a new update can be requested
    pending = false;
  }

  /// @notice Exposes the public data point in an ERC2362 compliant way.
  /// @dev Returns error `400` if queried for an unknown data point, and `404` if `completeUpdate` has never been called
  /// @dev successfully before.  
  function valueFor(bytes32 _id) external view override returns(int256, uint256, uint256) {
    // Unsupported data point ID
    if(_id != erc2362ID) return(0, 0, 400);
    // No value is yet available for the queried data point ID
    if (timestamp == 0) return(0, 0, 404);

    int256 value = int256(uint256(lastPrice));

    return(value, timestamp, 200);
  }
}

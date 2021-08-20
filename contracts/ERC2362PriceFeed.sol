// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;
pragma experimental ABIEncoderV2;

// Implements:
import "adomedianizer/contracts/interfaces/IERC2362.sol";
import "witnet-ethereum-bridge/contracts/UsingWitnet.sol";
import "witnet-ethereum-bridge/contracts/requests/WitnetRequestInitializableBase.sol";

// Your contract needs to inherit from UsingWitnet
contract ERC2362PriceFeed
    is
        IERC2362,
        UsingWitnet,
        WitnetRequestInitializableBase
{
    using Witnet for bytes;

    // /// Creator's address.
    address public immutable creator;

    /// Price decimals.
    uint8 public decimals;

    // The `keccak256` hash of the price feed, according to ERC2362 specs.`
    bytes32 public immutable erc2362ID;

    // The literal price feed name, according to ERC2362 specs.`
    string public literal;

    /// Stores the ID of the last Witnet request posting.
    uint256 public requestId;

    /// Tells if an update has been requested but not yet completed.
    bool public pending;

    /// The last received price point.
    uint64 public lastPrice;

    /// Stores the last Witnet-provided response data struct.
    Witnet.Response lastResponse;

    /// Notifies when a new Radon script is set.
    event DataRequestChanged(bytes32 erc2362ID, bytes32 codehash);
    
    /// Notifies when the price is updated.
    event PriceUpdated(uint64 price, uint8 decimals, uint256 epoch, bytes32 proof);

    /// Notifies when found an error decoding request result.
    event ResultError(string reason);

    /// Constructor.
    /// @param _wrb WitnetRequestBoard instance, or proxy, address.
    /// @param _erc2362str Price feed denomination, according to ERC2362 specs.
    /// @param _decimals Fixed number of decimals.
    constructor (
            WitnetRequestBoard _wrb,
            string memory _erc2362str,
            uint8 _decimals
        )
        UsingWitnet(_wrb)
    {
        creator = msg.sender;
        decimals = _decimals;
        literal = _erc2362str;
        erc2362ID = keccak256(abi.encodePacked(_erc2362str));
    }

    /// Modifies the Witnet Data Request bytecode used when requesting a new price update.
    /// @dev Fails if called when last request update was not yet completed, or if called
    /// @dev from an address different to the one that deployed this contract.
    function initialize(bytes memory _bytecode)
        public
        virtual override
    {
        require(msg.sender == creator, "ERC2362PriceFeed: only creator");
        WitnetRequestInitializableBase.initialize(_bytecode);
    }

    /// @notice Sends `request` to the WitnetRequestBoard.
    /// @dev This method will only succeed if `pending` is 0.  
    function requestUpdate()
        public payable
        virtual
    {
        require(pending == false, "ERC2362PriceFeed: pending update");

        // Send the request to Witnet and store the ID for later retrieval of the result:
        requestId = _witnetPostRequest(this);

        // Signal that there is already a pending request
        pending = true;
    }

    /// @notice Reads the result, if ready, from the WitnetRequestBoard.
    /// @dev The `witnetRequestAccepted` modifier comes with `UsingWitnet` and allows to
    /// @dev protect your methods from being called before the request has been successfully
    /// @dev relayed into Witnet.
    function completeUpdate()
        public 
        WitnetRequestSolved(requestId)
    {
        require(pending == true, "ERC2362PriceFeed: no pending update");

        // Retrieves copy of all response data related to the last request, removing it from the WRB.
        Witnet.Response memory _response = witnet.deleteQuery(requestId);
        Witnet.Result memory _result = witnet.resultFromCborBytes(_response.cborBytes);

        // If the Witnet request succeeded, decode the result and update the price point
        // If it failed, revert the transaction with a pretty-printed error message
        
        if (witnet.isOk(_result)) {
            lastPrice = witnet.asUint64(_result);
            lastResponse = _response;
            emit PriceUpdated(lastPrice, decimals, _response.epoch, _response.proof);
        } else {
            string memory errorMessage;
            // Try to read the value as an error message, catch error bytes if read fails
            try witnet.asErrorMessage(_result) returns (Witnet.ErrorCodes, string memory e) {
                errorMessage = e;
            }
            catch (bytes memory errorBytes) {
                errorMessage = string(errorBytes);
            }
            emit ResultError(errorMessage);
        }
        // In any case, set `pending` to false so a new update can be requested
        pending = false;
    }

    // ================================================================================================================
    // --- Implements 'IERC2362` --------------------------------------------------------------------------------------

    /// @notice Exposes the public data point in an ERC2362 compliant way.
    /// @dev Returns error `400` if queried for an unknown data point, and `404` if `completeUpdate` has never been called
    /// @dev successfully before.  
    function valueFor(bytes32 _erc2362id)
        external view
        override
        returns (int256, uint256 _timestamp, uint256)
    {
        // Unsupported data point ID
        if(_erc2362id != erc2362ID)
            return(0, 0, 400);

        _timestamp = lastResponse.timestamp;
        return (
            int256(uint256(lastPrice)),
            _timestamp,
            _timestamp == 0 ? 404 : 200
        );
    }
}

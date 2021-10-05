// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;
pragma experimental ABIEncoderV2;

// Implements:
import "ado-contracts/contracts/interfaces/IERC2362.sol";
import "witnet-solidity-bridge/contracts/UsingWitnet.sol";
import "witnet-solidity-bridge/contracts/patterns/Payable.sol";
import "witnet-solidity-bridge/contracts/requests/WitnetRequestInitializableBase.sol";

// Your contract needs to inherit from UsingWitnet
contract ERC2362PriceFeed
    is
        IERC2362,
        Payable,
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
    Witnet.Response public lastResponse;

    /// Notifies when a new Radon script is set.
    event DataRequestChanged(bytes32 erc2362ID, bytes32 codehash);
    
    /// Notifies when the price is updated.
    event PriceUpdated(uint64 price, uint8 decimals, uint256 timestamp, bytes32 drTxHash);

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
        Payable(address(0))
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
    /// @dev This method will only succeed if `pending` is `false`.
    function requestUpdate()
        public payable
        virtual
    {
        require(pending == false, "ERC2362PriceFeed: pending update");

        // Send the request to Witnet and store the ID for later retrieval of the result:
        uint256 _msgValue = _getMsgValue();
        uint256 _reward;
        (requestId, _reward) = _witnetPostRequest(this);

        // Signal that there is already a pending request
        pending = true;

        // Transfers back unused funds:
        if (_msgValue > _reward) {
            _safeTransferTo(payable(msg.sender), _msgValue - _reward);
        }
    }

    /// @notice Upgrade escrowed reward in the WRB, for currently pending request.
    /// @dev This method will only succeed if `pending` is `false`.
    function upgradeRequest()
        public payable
        virtual
    {
        require(pending == true, "ERC2362PriceFeed: no pending update");
        uint256 _msgValue = _getMsgValue();
        uint256 _added = _witnetUpgradeReward(requestId);
        // Transfers back unused funds:
        if (_msgValue > _added) {
            _safeTransferTo(payable(msg.sender), _msgValue - _added);
        }
    }

    /// @notice Reads the result, if ready, from the WitnetRequestBoard.
    /// @dev The `witnetRequestSolved` modifier comes with `UsingWitnet` and allows to
    /// @dev protect your methods from being called before the request has been successfully
    /// @dev relayed into Witnet.
    function completeUpdate()
        public 
        witnetRequestSolved(requestId)
    {
        require(pending == true, "ERC2362PriceFeed: request not solved");

        // Retrieves copy of all response data related to the last request, removing it from the WRB.
        Witnet.Response memory _response = witnet.deleteQuery(requestId);
        Witnet.Result memory _result = witnet.resultFromCborBytes(_response.cborBytes);

        // If the Witnet request succeeded, decode the result and update the price point
        // If it failed, revert the transaction with a pretty-printed error message
        
        if (witnet.isOk(_result)) {
            lastPrice = witnet.asUint64(_result);
            lastResponse = _response;
            emit PriceUpdated(lastPrice, decimals, _response.timestamp, _response.drTxHash);
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
    // --- Overrides 'UsingWitnet' ------------------------------------------------------------------------------------

    /// Estimate the reward amount.
    /// @return The reward to be included for the given gas price.
    function _witnetEstimateReward()
        internal view
        virtual override
        returns (uint256)
    {
        return witnet.estimateReward(_getGasPrice());
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

    // ================================================================================================================
    // --- Overrides 'Payable' ----------------------------------------------------------------------------------------

    /// Gets current transaction's gas price.
    function _getGasPrice()
        internal view
        virtual override
        returns (uint256)
    {
        return tx.gasprice;
    }

    /// Gets current payment value.
    function _getMsgValue()
        internal view
        virtual override
        returns (uint256)
    {
        return msg.value;
    }

    /// Perform safe transfer or whatever token is used for paying rewards.
    function _safeTransferTo(address payable _to, uint256 _amount)
        internal
        virtual override
    {
        _to.transfer(_amount);
    }
}

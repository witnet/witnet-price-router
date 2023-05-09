// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;
pragma experimental ABIEncoderV2;

import "witnet-solidity-bridge/contracts/WitnetPriceFeeds.sol";
import "witnet-solidity-bridge/contracts/interfaces/IERC165.sol";
import "witnet-solidity-bridge/contracts/interfaces/IWitnetPriceFeed.sol";
import "witnet-solidity-bridge/contracts/interfaces/IWitnetRequest.sol";
import "witnet-solidity-bridge/contracts/patterns/Clonable.sol";


// Your contract needs to inherit from UsingWitnet
contract WitnetPriceFeedBypass
    is
        Clonable,
        IWitnetPriceFeed,
        IWitnetRequest
{
    WitnetPriceFeeds immutable public feeds;
    WitnetRequestBoard immutable public witnet;

    string public caption;
    bytes4 public feedId;

    constructor(WitnetPriceFeeds _feeds) {
        assert(address(_feeds) != address(0));
        feeds = _feeds;
        witnet = feeds.witnet();
    }

    receive() external payable {}

    function cloneAndInitialize(string calldata _caption)
        virtual external
        returns (WitnetPriceFeedBypass)
    {
        return WitnetPriceFeedBypass(payable(_clone())).initializeClone(_caption);
    }


    /// ===============================================================================================================
    /// --- Clonable implementation -----------------------------------------------------------------------------------

    function initializeClone(string calldata _caption)
        virtual external
        initializer
        onlyDelegateCalls
        returns (WitnetPriceFeedBypass)
    {
        require(
            feeds.supportsCaption(_caption), 
            string(abi.encodePacked(
                "WitnetPriceFeedBypass: unsupported '",
                _caption,
                "'"
            ))
        );
        caption = _caption;
        feedId = bytes4(keccak256(bytes(_caption)));
        return WitnetPriceFeedBypass(payable(address(this)));
    }

    function initialized() virtual override public view returns (bool) {
        return feedId != 0;
    }

    
    /// ===============================================================================================================
    /// --- IWitnetRequest implementation -----------------------------------------------------------------------------

    function bytecode() override external view returns (bytes memory) {
        return feeds.lookupBytecode(feedId);
    }

    function hash() override external view returns (bytes32) {
        return feeds.lookupRadHash(feedId);
    }


    /// ===============================================================================================================
    /// --- IWitnetPriceFeed implementation ---------------------------------------------------------------------------

    /// @notice Estimates minimum fee amount in native currency to be paid when 
    /// @notice requesting a new price update.
    /// @dev Actual fee depends on the gas price of the `requestUpdate()` transaction.
    /// @param _gasPrice Gas price expected to be paid when calling `requestUpdate()`
    function estimateUpdateFee(uint256 _gasPrice)
        override
        external view
        returns (uint256)
    {
        return feeds.estimateUpdateBaseFee(feedId, _gasPrice, 0);
    }

    /// @notice Returns result of the last valid price update request successfully solved by the Witnet oracle.
    function lastPrice()
        override
        external view
        returns (int256)
    {
        IWitnetPriceSolver.Price memory _price = feeds.latestPrice(feedId);
        return int(_price.value);
    }

    /// @notice Returns the EVM-timestamp when last valid price was reported back from the Witnet oracle.
    function lastTimestamp()
        override 
        external view
        returns (uint256)
    {
        IWitnetPriceSolver.Price memory _price = feeds.latestPrice(feedId);
        return _price.timestamp;
    }

    /// @notice Returns tuple containing last valid price and timestamp, as well as status code of latest update
    /// @notice request that got posted to the Witnet Request Board.
    /// @return _lastPrice Last valid price reported back from the Witnet oracle.
    /// @return _lastTimestamp EVM-timestamp of the last valid price.
    /// @return _lastDrTxHash Hash of the Witnet Data Request that solved the last valid price.
    /// @return _latestUpdateStatus Status code of the latest update request.
    function lastValue()
        override
        external view
        returns (
            int _lastPrice,
            uint _lastTimestamp,
            bytes32 _lastDrTxHash,
            uint _latestUpdateStatus
        )
    {
        IWitnetPriceSolver.Price memory _price = feeds.latestPrice(feedId);
        _lastPrice = int(_price.value);
        _lastTimestamp = _price.timestamp;
        _lastDrTxHash = _price.drTxHash;
        if (_price.status == Witnet.ResultStatus.Ready) {
            _latestUpdateStatus = 200;
        } else if (_price.status == Witnet.ResultStatus.Awaiting) {
            _latestUpdateStatus = 404;
        } else {
            _latestUpdateStatus = 400;
        }
    }

    /// @notice Returns identifier of the latest update request posted to the Witnet Request Board.
    function latestQueryId()
        override
        external view
        returns (uint256)
    {
        return feeds.latestUpdateQueryId(feedId);
    }

    /// @notice Returns hash of the Witnet Data Request that solved the latest update request.
    /// @dev Returning 0 while the latest update request remains unsolved.
    function latestUpdateDrTxHash()
        override
        external view
        returns (bytes32)
    {
        IWitnetPriceSolver.Price memory _price = feeds.latestPrice(feedId);
        return _price.drTxHash;
    }

    /// @notice Returns error message of latest update request posted to the Witnet Request Board.
    /// @dev Returning empty string if the latest update request remains unsolved, or
    /// @dev if it was succesfully solved with no errors.
    function latestUpdateErrorMessage()
        override
        external view
        returns (string memory)
    {
        Witnet.ResultError memory _error = feeds.latestUpdateResultError(feedId);
        return _error.reason;
    }

    /// @notice Returns status code of latest update request posted to the Witnet Request Board:
    /// @dev Status codes:
    /// @dev   - 200: update request was succesfully solved with no errors
    /// @dev   - 400: update request was solved with errors
    /// @dev   - 404: update request was not solved yet 
    function latestUpdateStatus()
        override
        external view
        returns (uint256)
    {
        Witnet.ResultStatus _status = feeds.latestUpdateResultStatus(feedId);
        if (_status == Witnet.ResultStatus.Ready) {
            return 200;
        } else if (_status == Witnet.ResultStatus.Awaiting) {
            return 404;
        } else {
            return 400;
        }
    }

    /// @notice Returns `true` if latest update request posted to the Witnet Request Board 
    /// @notice has not been solved yet by the Witnet oracle.
    function pendingUpdate()
        override
        external view
        returns (bool)
    {
        return feeds.latestUpdateResultStatus(feedId) == Witnet.ResultStatus.Awaiting;
    }

    /// @notice Posts a new price update request to the Witnet Request Board. Requires payment of a fee
    /// @notice that depends on the value of `tx.gasprice`. See `estimateUpdateFee(uint256)`.
    /// @dev If previous update request was not solved yet, calling this method again allows
    /// @dev upgrading the update fee if called with a higher `tx.gasprice` value.
    function requestUpdate()
        override
        external payable
    {
        uint _usedFunds = feeds.requestUpdate{value: msg.value}(feedId);
        if (_usedFunds < msg.value) {
            payable(msg.sender).transfer(msg.value - _usedFunds);
        }
        emit PriceFeeding(
            msg.sender,
            feeds.latestUpdateQueryId(feedId),
            _usedFunds
        );
    }

    /// @notice Tells whether this contract implements the interface defined by `interfaceId`. 
    /// @dev See the corresponding https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified[EIP section]
    /// @dev to learn more about how these ids are created.
    function supportsInterface(bytes4 _id)
        override
        external pure
        returns (bool)
    {
        return (
            _id == type(IWitnetPriceFeed).interfaceId
                || _id == type(IERC165).interfaceId
        );
    }
}
// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;
pragma experimental ABIEncoderV2;

import "witnet-solidity-bridge/contracts/UsingWitnet.sol";

import "witnet-solidity-bridge/contracts/interfaces/IERC165.sol";
import "witnet-solidity-bridge/contracts/interfaces/IWitnetPriceFeed.sol";
import "witnet-solidity-bridge/contracts/requests/WitnetRequestBase.sol";

// Your contract needs to inherit from UsingWitnet
contract WitnetPriceFeed
    is
        IWitnetPriceFeed,
        UsingWitnet,
        WitnetRequestBase
{
    using Witnet for Witnet.Result;

    /// Stores the ID of the last price update posted to the Witnet Request Board.
    uint256 public override latestQueryId;

    /// Stores the ID of the last price update succesfully solved by the WRB.
    uint256 internal __lastValidQueryId;

    /// Constructor.
    /// @param _witnetRequestBoard WitnetRequestBoard entrypoint address.
    /// @param _witnetRequestBytecode Raw bytecode of Witnet Data Request to be used on every update request.
    constructor (
            WitnetRequestBoard _witnetRequestBoard,
            bytes memory _witnetRequestBytecode
        )
        UsingWitnet(_witnetRequestBoard)
        WitnetRequestBase(_witnetRequestBytecode)
    {}

    /// Estimates minimum fee amount in native currency to be paid when
    /// requesting a new price update.
    /// @dev Actual fee depends on the gas price of the `requestUpdate()` transaction.
    /// @param _gasPrice Gas price expected to be paid when calling `requestUpdate()`
    function estimateUpdateFee(uint256 _gasPrice)
        external view
        virtual override
        returns (uint256)
    {
        return witnet.estimateReward(_gasPrice);
    }

    /// Returns result of the last valid price update request successfully solved by the Witnet oracle.
    function lastPrice()
        public view
        virtual override
        returns (int256 _lastPrice)
    {
        uint _latestQueryId = latestQueryId;
        if (
            _latestQueryId > 0
                && witnet.checkResultStatus(_latestQueryId) == Witnet.ResultStatus.Ready
        ) {
            return int(witnet.readResponseResult(_latestQueryId).asUint());
        }
        if (__lastValidQueryId > 0) {
            return int(witnet.readResponseResult(__lastValidQueryId).asUint());
        }
    }

    /// Returns the EVM-timestamp when last valid price was reported back from the Witnet oracle.
    function lastTimestamp()
        public view
        virtual override
        returns (uint256 _lastTimestamp)
    {
        uint _latestQueryId = latestQueryId;
        if (
            _latestQueryId > 0
                && witnet.checkResultStatus(_latestQueryId) == Witnet.ResultStatus.Ready
        ) {
            return witnet.readResponseTimestamp(_latestQueryId);
        }
        if (__lastValidQueryId > 0) {
            return witnet.readResponseTimestamp(__lastValidQueryId);
        }
    }

    /// Returns tuple containing last valid price and timestamp, as well as status code of latest update
    /// request that got posted to the Witnet Request Board.
    /// @return _lastPrice Last valid price reported back from the Witnet oracle.
    /// @return _lastTimestamp EVM-timestamp of the last valid price.
    /// @return _lastDrTxHash Hash of the Witnet Data Request that solved the last valid price.
    /// @return _latestUpdateStatus Status code of the latest update request.
    function lastValue()
        external view
        virtual override
        returns (
            int _lastPrice,
            uint _lastTimestamp,
            bytes32 _lastDrTxHash,
            uint _latestUpdateStatus
        )
    {
        if (latestQueryId > 0) {
            Witnet.ResultStatus _latestResultStatus = witnet.checkResultStatus(latestQueryId);
            if (_latestResultStatus == Witnet.ResultStatus.Ready) {
                Witnet.Response memory _latestResponse = witnet.readResponse(latestQueryId);
                return (
                    int(Witnet.resultFromCborBytes(_latestResponse.cborBytes).asUint()),
                    _latestResponse.timestamp,
                    _latestResponse.drTxHash,
                    200
                );
            }
            if (__lastValidQueryId > 0) {
                Witnet.Response memory _lastValidResponse = witnet.readResponse(__lastValidQueryId);
                return (
                    int(Witnet.resultFromCborBytes(_lastValidResponse.cborBytes).asUint()),
                    _lastValidResponse.timestamp,
                    _lastValidResponse.drTxHash,
                    _latestResultStatus == Witnet.ResultStatus.Error ? 400 : 404
                );
            }
        }
        return (0, 0, 0, 404);
    }

    /// Returns identifier of the latest update request posted to the Witnet Request Board.
    /// @dev Returning 0 while the latest update request remains unsolved.
    function latestUpdateDrTxHash()
        external view
        virtual override
        returns (bytes32)
    {
        uint256 _latestQueryId = latestQueryId;
        if (_latestQueryId > 0) {
            if (_witnetCheckResultAvailability(_latestQueryId)) {
                return witnet.readResponseDrTxHash(_latestQueryId);
            }
        }
        return bytes32(0);
    }

    /// Returns error message of latest update request posted to the Witnet Request Board.
    /// @dev Returning empty string if the latest update request remains unsolved, or
    /// @dev if it was succesfully solved with no errors.
    function latestUpdateErrorMessage()
        external view
        virtual override
        returns (string memory _errorMessage)
    {
        if (latestQueryId > 0) {
            Witnet.ResultError memory _error = witnet.checkResultError(latestQueryId);
            return _error.reason;
        }
    }

    /// Returns status code of latest update request posted to the Witnet Request Board:
    /// @dev Status codes:
    /// @dev   - 200: update request was succesfully solved with no errors
    /// @dev   - 400: update request was solved with errors
    /// @dev   - 404: update request was not solved yet
    function latestUpdateStatus()
        public view
        virtual override
        returns (uint256)
    {
        if (latestQueryId > 0) {
            Witnet.ResultStatus _latestResultStatus = witnet.checkResultStatus(latestQueryId);
            if (_latestResultStatus == Witnet.ResultStatus.Ready) {
                return 200; 
            } else if (_latestResultStatus == Witnet.ResultStatus.Awaiting) {
                return 404;
            } else {
                return 400;
            }
        }
        return 200;
    }

    /// Returns `true` if latest update request posted to the Witnet Request Board
    /// has not been solved yet by the Witnet oracle.
    function pendingUpdate()
        public view
        virtual override
        returns (bool)
    {
        return (
            latestQueryId != 0
                && !_witnetCheckResultAvailability(latestQueryId)
        );
    }

    /// Posts a new price update request to the Witnet Request Board. Requires payment of a fee
    /// that depends on the value of `tx.gasprice`. See `estimateUpdateFee(uint256)`.
    /// @dev If previous update request was not solved yet, calling this method again allows
    /// @dev upgrading the update fee if called with a higher `tx.gasprice` value.
    function requestUpdate()
        public payable
        virtual override
    {
        uint _usedFunds;
        uint _latestQueryId = latestQueryId;
        uint _latestUpdateStatus = latestUpdateStatus();
        if (_latestUpdateStatus == 404) {
            // latest update is still pending, so just raise upgrade reward,
            // accordingly to current tx gasprice:
            _usedFunds = _witnetUpgradeReward(_latestQueryId);
        } else {
            // Check if latest update ended successfully:
            if (_latestUpdateStatus == 200) {
                // If so, remove previous last valid query from the WRB:
                if (__lastValidQueryId > 0) {
                    witnet.deleteQuery(__lastValidQueryId);
                }
                __lastValidQueryId = _latestQueryId;
            } else {
                // Otherwise, delete latest query, as it was faulty
                // and we are about to post a new update request:
                witnet.deleteQuery(_latestQueryId);
            }
            // Post update request to the WRB:
            (_latestQueryId, _usedFunds) = _witnetPostRequest(this);
            // Update latest query id:
            latestQueryId = _latestQueryId;
        }
        // Transfer back unused funds:
        payable(msg.sender).transfer(msg.value - _usedFunds);
        if (_usedFunds > 0) {
            emit PriceFeeding(msg.sender, _latestQueryId, _usedFunds);
        }
    }

    /// Tells whether this contract implements the interface defined by `interfaceId`.
    /// @dev See the corresponding https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified[EIP section]
    /// @dev to learn more about how these ids are created.
    function supportsInterface(bytes4 _interfaceId)
        public view
        virtual override
        returns (bool)
    {
        return (
            _interfaceId == type(IERC165).interfaceId
                || _interfaceId == type(IWitnetPriceFeed).interfaceId
        );
    }
}

// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;
pragma experimental ABIEncoderV2;

import "witnet-solidity-bridge/contracts/UsingWitnet.sol";
import "witnet-solidity-bridge/contracts/requests/WitnetRequest.sol";

import "witnet-solidity-bridge/contracts/examples/WitnetPriceRouter.sol";

// Your contract needs to inherit from UsingWitnet
contract WitnetPriceFeed
    is
        IWitnetPriceFeed,
        UsingWitnet,
        WitnetRequest
{
    using Witnet for bytes;

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
        WitnetRequest(_witnetRequestBytecode)
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
        Witnet.Result memory _result;
        uint _latestQueryId = latestQueryId;
        if (
            _latestQueryId > 0
                && _witnetCheckResultAvailability(_latestQueryId)
        ) {
            _result = witnet.readResponseResult(_latestQueryId);
            if (_result.success) {
                return int256(int64(witnet.asUint64(_result)));
            }
        }
        if (__lastValidQueryId > 0) {
            _result = witnet.readResponseResult(__lastValidQueryId);
            return int256(int64(witnet.asUint64(_result)));    
        }
    }

    /// Returns the EVM-timestamp when last valid price was reported back from the Witnet oracle.
    function lastTimestamp()
        public view
        virtual override
        returns (uint256 _lastTimestamp)
    {
        Witnet.Result memory _result;
        Witnet.Response memory _response;
        uint _latestQueryId = latestQueryId;
        if (
            _latestQueryId > 0
                && _witnetCheckResultAvailability(_latestQueryId)
        ) {
            _response = witnet.readResponse(_latestQueryId);
            _result = witnet.resultFromCborBytes(_response.cborBytes);
            if (_result.success) {
                return _response.timestamp;
            }
        }
        if (__lastValidQueryId > 0) {
            _response = witnet.readResponse(__lastValidQueryId);
            return _response.timestamp;
        }
    }

    /// Returns tuple containing last valid price and timestamp, as well as status code of latest update
    /// request that got posted to the Witnet Request Board.
    /// @return _lastPrice Last valid price reported back from the Witnet oracle.
    /// @return _lastTimestamp EVM-timestamp of the last valid price.
    /// @return _latestUpdateStatus Status code of the latest update request.
    function lastValue()
        external view
        virtual override
        returns (
            int _lastPrice,
            uint _lastTimestamp,
            uint _latestUpdateStatus
        )
    {
        uint _latestQueryId = latestQueryId;
        if (_latestQueryId > 0) {
            bool _pendingRequest = _witnetCheckResultAvailability(_latestQueryId);
            if (_pendingRequest) {
                Witnet.Response memory _latestResponse = witnet.readResponse(_latestQueryId);
                Witnet.Result memory _latestResult = witnet.resultFromCborBytes(_latestResponse.cborBytes);
                if (_latestResult.success) {
                    return (
                        int256(int64(witnet.asUint64(_latestResult))),
                        _latestResponse.timestamp,
                        200
                    );
                }
            }
            if (__lastValidQueryId > 0) {
                Witnet.Response memory _lastValidResponse = witnet.readResponse(__lastValidQueryId);
                Witnet.Result memory _lastValidResult = witnet.resultFromCborBytes(_lastValidResponse.cborBytes);
                return (
                    int256(int64(witnet.asUint64(_lastValidResult))),
                    _lastValidResponse.timestamp,
                    404
                );
            }
        }
        return (0, 0, 404);
    }

    /// Returns hash of the Witnet Data Request that solved the latest update request.
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
        uint256 _latestQueryId = latestQueryId;
        if (_latestQueryId > 0) {
            if (_witnetCheckResultAvailability(_latestQueryId)) {
                Witnet.Result memory _latestResult = witnet.readResponseResult(_latestQueryId);
                if (_latestResult.success == false) {
                    (, _errorMessage) = witnet.asErrorMessage(_latestResult);
                }
            }
        }
    }

    /// Returns status code of latest update request posted to the Witnet Request Board:
    /// @dev Status codes:
    /// @dev   - 200: update request was succesfully solved with no errors
    /// @dev   - 400: update request solved with errors
    /// @dev   - 404: update request was not yet solved
    function latestUpdateStatus()
        public view
        virtual override
        returns (uint256)
    {
        uint _latestQueryId = latestQueryId;
        if (_latestQueryId > 0) {
            if (_witnetCheckResultAvailability(_latestQueryId)) {
                Witnet.Result memory _result = witnet.readResponseResult(_latestQueryId);
                return (
                    _result.success
                        ? 200 // OK
                        : 400 // Bad result
                );
            } else {
                return 404; // not yet solved;
            }
        }
        return 200;
    }

    /// Returns `true` if latest update request posted to the Witnet Request Board 
    /// was not yet solved by the Witnet oracle.
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
    /// Moreover, it will transfer back unused funds if payed a higher fee than the one strictly 
    /// required by the Witnet Request Board.
    /// @dev If previous update request was not yet solved, calling this method again enables
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
                // If so, remove previous last valid valid query from the WRB:
                if (__lastValidQueryId > 0) {
                    _witnetDeleteQuery(__lastValidQueryId);
                }
                __lastValidQueryId = _latestQueryId;
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

    /// Returns true if this contract implements the interface defined by `interfaceId`. 
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

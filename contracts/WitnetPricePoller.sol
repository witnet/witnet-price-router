// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;
pragma experimental ABIEncoderV2;

import "witnet-solidity-bridge/contracts/UsingWitnet.sol";
import "witnet-solidity-bridge/contracts/examples/WitnetPriceRegistry.sol";
import "witnet-solidity-bridge/contracts/requests/WitnetRequest.sol";

// Your contract needs to inherit from UsingWitnet
contract WitnetPricePoller
    is
        IWitnetPricePoller,
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

    function estimateUpdateFee(uint256 _gasPrice)
        external view
        virtual override
        returns (uint256)
    {
        return witnet.estimateReward(_gasPrice);
    }

    function supportsInterface(bytes4 _interfaceId)
        public view 
        virtual override
        returns (bool)
    {
        return (
            _interfaceId == type(IERC165).interfaceId
                || _interfaceId == type(IWitnetPricePoller).interfaceId
        );
    }

    /// Returns last valid Witnet response.
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

    function lastValue()
        external view
        virtual override
        returns (int _lastPrice, uint _lastTimestamp, bytes32 _lastDrTxHash)
    {
        Witnet.Response memory _response;
        Witnet.Result memory _result;
        uint _latestQueryId = latestQueryId;
        if (
            _latestQueryId > 0
                && _witnetCheckResultAvailability(_latestQueryId)
        ) {
            _response = witnet.readResponse(_latestQueryId);
            _result = witnet.resultFromCborBytes(_response.cborBytes);
            if (_result.success) {
                return (
                    int256(int64(witnet.asUint64(_result))),
                    _response.timestamp,
                    _response.drTxHash
                );
            }
        }
        if (__lastValidQueryId > 0) {
            _response = witnet.readResponse(__lastValidQueryId);
            _result = witnet.resultFromCborBytes(_response.cborBytes);
            return (
                int256(int64(witnet.asUint64(_result))),
                _response.timestamp,
                _response.drTxHash
            );
        }
    }

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

    function latestUpdateErrorMessage()
        external view
        virtual override
        returns (string memory _errorMessage)
    {
        uint256 _latestQueryId = latestQueryId;
        if (_latestQueryId > 0) {
            if (_witnetCheckResultAvailability(_latestQueryId)) {
                Witnet.Result memory _result = witnet.readResponseResult(_latestQueryId);
                if (_result.success == false) {
                    // Try to read the value as an error message, catch error bytes if read fails
                    try witnet.asErrorMessage(_result) returns (Witnet.ErrorCodes, string memory e) {
                        _errorMessage = e;
                    }
                    catch (bytes memory errorBytes) {
                        _errorMessage = string(errorBytes);
                    }
                }
            }
        }
    }

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

    /// Tells if an update has been requested but was not yet completed.
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

    /// Requests a new price update to the WitnetRequestBoard.
    /// @dev If previous request was not yet solved, this method enables upgrading
    /// @dev Witnet reward of that request, accordingly to current tx gasprice.
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
            emit PricePolling(msg.sender, _latestQueryId, _usedFunds);
        }
    }
}

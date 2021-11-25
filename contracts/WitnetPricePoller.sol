// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;
pragma experimental ABIEncoderV2;

// Implements:
import "witnet-solidity-bridge/contracts/UsingWitnet.sol";
import "./interfaces/IERC2362PricePoller.sol";

// Your contract needs to inherit from UsingWitnet
contract WitnetPricePoller
    is
        UsingWitnet,
        IERC2362PricePoller
{
    using Witnet for bytes;

    /// Witnet Data Request that will be used for updating price values.
    IWitnetRequest immutable public witnetRequest;

    /// Stores the ID of the last price update posted to the Witnet Request Board.
    uint256 public latestQueryId;

    /// Stores the ID of the last price update succesfully solved by the WRB.
    uint256 internal _lastValidQueryId;
    
    /// Constructor.
    /// @param _wrb WitnetRequestBoard instance, or proxy, address.
    /// @param _request Witnet Data Request to be used for fetching and updating the price.
    constructor (
            WitnetRequestBoard _wrb,
            IWitnetRequest _request
        )
        UsingWitnet(_wrb)
    {
        assert(address(_request) != address(0));
        witnetRequest = _request;
    }

    /// The last received price point.
    function lastPrice()
        public view
        virtual override
        returns (int256)
    {
        Witnet.Result memory _result;
        if (pendingUpdate()) {
            _result = witnet.readResponseResult(_lastValidQueryId);
        } else {
            _result = witnet.readResponseResult(latestQueryId);
            if (!witnet.isOk(_result)) {
                _result = witnet.readResponseResult(_lastValidQueryId);
            }
        } 
        return int256(int64(witnet.asUint64(_result)));
    }

    function lastTimestamp()
        public view
        virtual override
        returns (uint256)
    {
        Witnet.Response memory _response;
        if (pendingUpdate()) {
            _response = witnet.readResponse(_lastValidQueryId);
        } else {
            _response = witnet.readResponse(latestQueryId);
            Witnet.Result memory _result = witnet.resultFromCborBytes(_response.cborBytes);
            if (!witnet.isOk(_result)) {
                _response = witnet.readResponse(_lastValidQueryId);
            }
        }
        return _response.timestamp;
    }

    function lastValue()
        external view
        virtual override
        returns (int, uint, bytes32)
    {
        Witnet.Response memory _response;
        Witnet.Result memory _result;
        if (pendingUpdate() || latestStatus() != 0) {
            _response = witnet.readResponse(_lastValidQueryId);
        } else {
            _response = witnet.readResponse(latestQueryId);
        }
        _result = witnet.resultFromCborBytes(_response.cborBytes);
        return (
            int256(int64(witnet.asUint64(_result))),
            _response.timestamp,
            _response.drTxHash
        );
    }

    function latestErrorMessage()
        external view
        virtual override
        returns (string memory _errorMessage)
    {
        if (!pendingUpdate()) {
            Witnet.Result memory _result = witnet.readResponseResult(latestQueryId);
            // Try to read the value as an error message, catch error bytes if read fails
            try witnet.asErrorMessage(_result) returns (Witnet.ErrorCodes, string memory e) {
                _errorMessage = e;
            }
            catch (bytes memory errorBytes) {
                _errorMessage = string(errorBytes);
            }
        }
    }

    function latestStatus()
        public view
        virtual override
        returns (uint256)
    {
        if (pendingUpdate()) {
            return 404; // Not found
        } else {
            Witnet.Result memory _result = witnet.readResponseResult(latestQueryId);
            return (witnet.isOk(_result)
                ? 200   // OK
                : 400   // Bad request
            );
        }
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
        if (pendingUpdate()) {
            // Raise reward of last posted request, accordingly to current tx gasprice
            _usedFunds = _witnetUpgradeReward(latestQueryId);
        } else {
            // Update last valid request id if previous posting got solved succesfully:
            if (latestStatus() == 0) {
                _lastValidQueryId = latestQueryId;
            }
            // Removes previous query to WRB, if any:
            if (latestQueryId != 0) {
                _witnetDeleteQuery(latestQueryId);
            }
            (latestQueryId, _usedFunds) = _witnetPostRequest(witnetRequest);
        }
        // Transfer back unused funds:
        payable(msg.sender).transfer(msg.value - _usedFunds);
        emit PricePolling(msg.sender, _usedFunds);
    }
}

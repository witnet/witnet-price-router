// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;
pragma experimental ABIEncoderV2;

import "./WitnetPriceFeedRouted.sol";

abstract contract WitnetPriceFeedRoutedCached
    is
        WitnetPriceFeedRouted
{  
    int256 internal __lastPrice;
    uint256 internal __lastTimestamp;
    bytes32 internal __lastDrTxHash; 

    /// Constructor.
    /// @param _witnetPriceRouter Address of the WitnetPriceRouter instance supporting given pairs
    constructor (IWitnetPriceRouter _witnetPriceRouter)
        WitnetPriceFeedRouted(_witnetPriceRouter)
    {}

    /// Returns the ID of the last update posted to the Witnet Request Board.
    /// @dev A WitnetPriceFeedRoutedCached instance will always return 0, as price updates will be 
    /// @dev synchronously calculated every time `requestUpdate()` is called.
    function latestQueryId()
        external pure
        override
        returns (uint256 _latest)
    {
        return 0;
    }

    /// Returns result of the price value that got calculated the last time `requestUpdate()` was called.
    function lastPrice()
        external view
        virtual override
        returns (int256 _lastPrice)
    {
        return __lastPrice;
    }

    /// Returns the EVM-timestamp when `lastPrice()` got updated.
    function lastTimestamp()
        external view
        virtual override
        returns (uint256 _lastTimestamp)
    {
        return __lastTimestamp;
    }

    /// Returns tuple containing last valid price and timestamp, as well as status code of the latest update
    /// request that got posted to the Witnet Request Board from any of the referred currency pairs.
    /// @return _lastPrice Price value calculated the last time `requestUpdate()` was called.
    /// @return _lastTimestamp EVM-timestamp of the last valid price.
    /// @return _lastDrTxHash Hash of the latest Witnet Data Request that modified the last price.
    /// @return _latestUpdateStatus Status code of the latest update request from any of the referred currency pairs.
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
        _lastPrice = __lastPrice;
        _lastTimestamp = __lastTimestamp;
        _lastDrTxHash = __lastDrTxHash;
        _latestUpdateStatus = pendingUpdate() ? 404 : 200;
    }

    /// Returns hash of the latest Witnet Data Request that modified the last price.
    function latestUpdateDrTxHash()
        external view
        virtual override
        returns (bytes32)
    {
        return __lastDrTxHash;
    }

    /// Returns error message of latest update request posted to the Witnet Request Board.
    /// @dev A WitnetPriceFeedRoutedCached will always return empty string, as `latestUpdateDrTxHash()` 
    /// @dev always returns hashes of succesfully solved update requests from any of the routed
    /// @dev currency pairs.
    function latestUpdateErrorMessage()
        external pure
        virtual override
        returns (string memory _errorMessage)
    {
        return "";
    }

    /// Returns whether there's a pending update on any of the referred currency pairs.
    /// @dev Status codes:
    /// @dev   - 200: update request was succesfully solved with no errors
    /// @dev   - 404: update request was not solved yet 
    function latestUpdateStatus()
        public view
        virtual override
        returns (uint256 _latestUpdateStatus)
    {
        return pendingUpdate() ? 404 : 400;
    }

    /// Returns `true` if a change in any of referred pairs is detected since the last time `requestUpdate()` was called.
    function pendingUpdate()
        public view
        virtual override
        returns (bool)
    {
        return (
            _getLatestTimestamp() > __lastTimestamp
        );
    }

    /// Re-calculate price based on current last values of referred currency pairs, and saves it in storage.
    /// @dev This method requires no fee, so any value received will be transfered back.
    function requestUpdate()
        external payable
        virtual override
    {
        int256[] memory _prices = new int256[](pairs.length);
        bytes32 _lastDrTxHash; uint _latestTimestamp;
        for (uint _i = 0; _i < _prices.length; _i ++) {
            uint _ts; bytes32 _hash;
            (_prices[_i], _ts, _hash, ) = _getPriceFeed(_i).lastValue();
            if (_ts > _latestTimestamp) {
                _lastDrTxHash = _hash;
                _latestTimestamp = _ts;
            }
        }
        __lastDrTxHash = _lastDrTxHash;
        __lastPrice = _calculate(_prices);
        __lastTimestamp = block.timestamp;
        if (msg.value > 0) {
            payable(msg.sender).transfer(msg.value);
        }
        emit PriceFeeding(msg.sender, 0, 0);
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
                || _interfaceId == type(WitnetPriceFeedRoutedCached).interfaceId
        );
    }

    // ========================================================================
    // --- INTERNAL METHODS ---------------------------------------------------

    /// @dev Returns timestamp of latest valid update of any of referred currency pairs.
    function _getLatestTimestamp()
        internal view
        returns (uint _lastTimestamp)
    {
        for (uint _i = 0; _i < pairs.length; _i ++) {
            uint _ts = _getPriceFeed(_i).lastTimestamp();
            if (_ts > _lastTimestamp) {
                _lastTimestamp = _ts;
            }
        }
    }
}

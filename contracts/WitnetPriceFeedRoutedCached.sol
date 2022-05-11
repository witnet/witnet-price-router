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

    /// Returns the ID of the last price update posted to the Witnet Request Board.
    function latestQueryId()
        external pure
        override
        returns (uint256 _latest)
    {
        return 0;
    }

    /// Returns result of the last valid price update request successfully solved by the Witnet oracle.
    function lastPrice()
        external view
        virtual override
        returns (int256 _lastPrice)
    {
        return __lastPrice;
    }

    /// Returns the EVM-timestamp when last valid price was reported back from the Witnet oracle.
    function lastTimestamp()
        external view
        virtual override
        returns (uint256 _lastTimestamp)
    {
        return __lastTimestamp;
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
        _lastPrice = __lastPrice;
        _lastTimestamp = __lastTimestamp;
        _lastDrTxHash = __lastDrTxHash;
        _latestUpdateStatus = pendingUpdate() ? 404 : 200;
    }

    /// Returns identifier of the latest update request posted to the Witnet Request Board.
    /// @dev Returning 0 while the latest update request remains unsolved.
    function latestUpdateDrTxHash()
        external view
        virtual override
        returns (bytes32)
    {
        return __lastDrTxHash;
    }

    /// Returns error message of latest update request posted to the Witnet Request Board.
    /// @dev Returning empty string if the latest update request remains unsolved, or
    /// @dev if it was succesfully solved with no errors.
    function latestUpdateErrorMessage()
        external pure
        virtual override
        returns (string memory _errorMessage)
    {
        return "";
    }

    /// Returns status code of latest update request posted to the Witnet Request Board:
    /// @dev Status codes:
    /// @dev   - 200: update request was succesfully solved with no errors
    /// @dev   - 400: update request was solved with errors
    /// @dev   - 404: update request was not solved yet 
    function latestUpdateStatus()
        public view
        virtual override
        returns (uint256 _latestUpdateStatus)
    {
        return pendingUpdate() ? 404 : 400;
    }

    /// Returns `true` if a change in any of routed pairs is detected, while not being fetched and stored yet.
    function pendingUpdate()
        public view
        virtual override
        returns (bool)
    {
        return (
            _getLatestTimestamp() > __lastTimestamp
        );
    }

    /// Retrieves from router latest prices of routed prices. If Posts a new price update request to the Witnet Request Board. Requires payment of a fee
    /// that depends on the value of `tx.gasprice`. See `estimateUpdateFee(uint256)`.
    /// @dev If previous update request was not solved yet, calling this method again allows
    /// @dev upgrading the update fee if called with a higher `tx.gasprice` value.
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

    /// @dev Returns timestamp of latest valid update of any of routed currency pairs.
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

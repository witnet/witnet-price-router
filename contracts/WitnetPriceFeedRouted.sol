// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;
pragma experimental ABIEncoderV2;

import "witnet-solidity-bridge/contracts/interfaces/IWitnetPriceFeed.sol";
import "witnet-solidity-bridge/contracts/interfaces/IWitnetPriceRouter.sol";

abstract contract WitnetPriceFeedRouted
    is
        IWitnetPriceFeed
{
    /// Immutable IWitnetPriceRouter instance that will be used for price calculation.
    IWitnetPriceRouter immutable public router;

    /// List of currency pairs from which the price of this price feed will be calculated.
    bytes32[] public pairs;
   
    /// Constructor.
    /// @param _witnetPriceRouter Address of the WitnetPriceRouter instance supporting given pairs
    constructor (IWitnetPriceRouter _witnetPriceRouter) {
        assert(address(_witnetPriceRouter) != address(0));
        router = _witnetPriceRouter;
    }

    /// @dev Routed price feeds require no fee.
    function estimateUpdateFee(uint256)
        external pure
        virtual override
        returns (uint256)
    {
        return 0;
    }

    /// Returns number of pairs from which this price feed will be calculated.
    function getPairsCount()
        external view
        returns (uint256)
    {
        return pairs.length;
    }

    /// Returns on-the-fly calculated price, based on last valid values of referred currency pairs.
    function lastPrice()
        external view
        virtual override
        returns (int256 _lastPrice)
    {
        int256[] memory _prices = new int256[](pairs.length);
        for (uint _i = 0; _i < _prices.length; _i ++) {
            _prices[_i] = _getPriceFeed(_i).lastPrice();
        }
        return _calculate(_prices);
    }

    /// Returns timestamp of the latest valid update on any of the referred currency pairs.
    function lastTimestamp()
        external view
        virtual override
        returns (uint256 _lastTimestamp)
    {
        for (uint _i = 0; _i < pairs.length; _i ++) {
            uint256 _ts = _getPriceFeed(_i).lastTimestamp();
            if (_ts > _lastTimestamp) {
                _lastTimestamp = _ts;
            }
        }
    }

    /// Returns tuple containing last valid price and timestamp, as well as status code of latest update
    /// request that got posted to the Witnet Request Board from any of the referred currency pairs.
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
        _latestUpdateStatus = 200;
        int256[] memory _prices = new int256[](pairs.length);        
        for (uint _i = 0; _i < _prices.length; _i ++) {
            uint _ts; uint _lus; bytes32 _hash;
            IWitnetPriceFeed _pf = _getPriceFeed(_i);
            (_prices[_i], _ts, _hash, _lus) = _pf.lastValue();
            if (_ts > _lastTimestamp) {
                _lastTimestamp = _ts;
                _lastDrTxHash = _hash;
            }
            if (_lus > _latestUpdateStatus) {
                _latestUpdateStatus = _lus;
            }
        }
        _lastPrice = _calculate(_prices);
    }

    /// Returns the ID of the last price update posted to the Witnet Request Board,
    /// from any of the referred currency pairs.
    function latestQueryId()
        external view
        virtual override
        returns (uint256 _latest)
    {
        for (uint _i = 0; _i < pairs.length; _i ++) {
            uint256 _queryId = _getPriceFeed(_i).latestQueryId();
            if (_queryId > _latest) {
                _latest = _queryId;
            }
        }
    }

    /// Returns identifier of the latest update request posted to the Witnet Request Board,
    /// from any of the referred currency pairs.
    /// @dev Returning 0 while the latest update request remains unsolved.
    function latestUpdateDrTxHash()
        external view
        virtual override
        returns (bytes32)
    {
        (uint _index, ) = _latestUpdateStatusIndex();
        return _getPriceFeed(_index).latestUpdateDrTxHash();
    }

    /// Returns error message of latest update request posted to the Witnet Request Board,
    /// from any of the referred currency pairs.
    /// @dev Returning empty string if the latest update request remains unsolved, or
    /// @dev if it was succesfully solved with no errors.
    function latestUpdateErrorMessage()
        external view
        virtual override
        returns (string memory _errorMessage)
    {
        (uint _index, ) = _latestUpdateStatusIndex();
        return _getPriceFeed(_index).latestUpdateErrorMessage();
    }

    /// Returns status code of latest update request posted to the Witnet Request Board,
    /// from any of the referred currency pairs.
    /// @dev Status codes:
    /// @dev   - 200: update request was succesfully solved with no errors
    /// @dev   - 400: update request was solved with errors
    /// @dev   - 404: update request was not solved yet 
    function latestUpdateStatus()
        public view
        virtual override
        returns (uint256 _latestUpdateStatus)
    {
        (, _latestUpdateStatus) = _latestUpdateStatusIndex();
    }

    /// Returns `true` if any of the referred currency pairs awaits for an update.
    function pendingUpdate()
        public view
        virtual override
        returns (bool)
    {
        for (uint _i = 0; _i < pairs.length; _i ++) {
            if (_getPriceFeed(_i).pendingUpdate()) {
                return true;
            }
        }
        return false;
    }

    /// @dev This method will always revert on a WitnetPriceFeedRouted instance.
    function requestUpdate()
        external payable
        virtual override
    {
        revert("WitnetPriceFeedRouted: not supported");
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
                || _interfaceId == type(WitnetPriceFeedRouted).interfaceId
        );
    }

    // ========================================================================
    // --- INTERNAL METHODS ---------------------------------------------------

    /// @dev Asks immutable router to provide latest known address of the IWitnetPriceFeed contract
    /// @dev serving the currency pair that was provided at the 'index'-th position on construction.
    function _getPriceFeed(uint _index)
        internal view
        returns (IWitnetPriceFeed _pf)
    {
        _pf = IWitnetPriceFeed(address(router.getPriceFeed(pairs[_index])));
        require(
            address(_pf) != address(0),
            "WitnetPriceFeedRouted: deprecated currency pair"
        );
    }

    /// @dev Returns highest of all latest update status codes of the currency pairs that compose this price feed,
    /// @dev and index of the currency pair that currently states the highest value. In case of repetition, will
    /// @dev return the one with the lowest index.
    function _latestUpdateStatusIndex()
        internal view
        returns (uint _index, uint _latestUpdateStatus)
    {
        _latestUpdateStatus = 200;
        for (uint _i = 0; _i < pairs.length; _i ++) {
            uint _lus = _getPriceFeed(_i).latestUpdateStatus();
            if (_lus > _latestUpdateStatus) {
                _index = _i;
                _latestUpdateStatus = _lus;
                if (_lus == 404) {
                    break;
                }
            }
        }
    }

    /// @dev Derive price from given sources.
    /// @param _prices Array of last prices for each one of the currency pairs specified on constructor, 
    /// in the same order as they were specified.
    function _calculate(int256[] memory _prices) internal pure virtual returns (int256);
}

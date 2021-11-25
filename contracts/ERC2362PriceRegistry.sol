// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;
pragma experimental ABIEncoderV2;

// Inherits from:
import "ado-contracts/contracts/interfaces/IERC2362.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Uses:
import "./interfaces/IERC2362PricePoller.sol";

contract ERC2362PriceRegistry
    is
        IERC2362,
        Ownable
{
    event PricePairSet(bytes32 indexed id, address poller);

    struct PricePair {
        address poller;
        uint256 decimals;
        string  base;
        string  quote;
    }

    bytes32[] public pricePairs;
    mapping (bytes32 => PricePair) internal _pairs;
    mapping (address => bytes32) internal _pollers;

    function getPricePoller(bytes32 _erc2362id)
        public view
        returns (IERC2362PricePoller)
    {
        return IERC2362PricePoller(_pairs[_erc2362id].poller);
    }

    function lookupERC2362ID(bytes32 _erc2362id)
        public view
        returns (string memory _caption)
    {
        PricePair storage _pair = _pairs[_erc2362id];
        if (
            bytes(_pair.base).length > 0 
                && bytes(_pair.quote).length > 0
        ) {
            _caption = string(abi.encodePacked(
                "Price-",
                _pair.base,
                "/",
                _pair.quote,
                "-",
                "" // TODO _pair.decimals.toString()
            ));
        }
    }

    function setPricePoller(
            address _poller,
            uint256 _decimals,
            string calldata _base,
            string calldata _quote
        )
        external
        onlyOwner
    {
        bytes memory _caption = abi.encodePacked(
            "Price-",
            bytes(_base),  // TODO: .toUpperCase()
            "/",
            bytes(_quote), // TODO: .toUpperCase()
            "-",
            _decimals      // TODO: .toString()
        );
        bytes32 _erc2362id = keccak256(_caption);
        PricePair storage _record = _pairs[_erc2362id];
        address _currentPoller = _record.poller;
        if (bytes(_record.base).length == 0) {
            _record.base = _base; // .toUpperCase()
            _record.quote = _quote; // .toUpperCase()
            _record.decimals = _decimals;
            pricePairs.push(_erc2362id);
        }
        else if (_currentPoller != address(0)) {
            _pollers[_currentPoller] = bytes32(0);
        }
        if (_poller != _currentPoller) {
            _pollers[_poller] = _erc2362id;
        }
        _record.poller = _poller;
        emit PricePairSet(_erc2362id, _poller);
    }

    function supportedPricePair(bytes32 _erc2362id)
        public view
        returns (bool)
    {
        return _pairs[_erc2362id].poller != address(0);
    }

    function supportedPricePoller(address _poller)
        public view
        returns (bool)
    {
        return _pairs[_pollers[_poller]].poller == _poller;
    }

    /// Exposed function pertaining to EIP standards
	/// @param _erc2362id bytes32 ID of the query
	function valueFor(bytes32 _erc2362id)
        external view
        virtual override
        returns (
            int256 _value,
            uint256 _timestamp,
            uint256 _status
        )
    {
        IERC2362PricePoller _poller = getPricePoller(_erc2362id);
        if (address(_poller) != address(0)) {
            bytes32 _proof;
            (_value, _timestamp, _proof) = _poller.lastValue();
            _status = (_proof == bytes32(0)
                ? 404   // bad value
                : 200   // ok
            );
        } else {
            _status = 400; // not found
        }
    }
}
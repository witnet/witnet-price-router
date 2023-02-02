// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "../WitnetPriceFeedRouted.sol";

contract QuickUsdPriceFeed
    is
        WitnetPriceFeedRouted
{    
    constructor (IWitnetPriceRouter _witnetPriceRouter)
        WitnetPriceFeedRouted(_witnetPriceRouter)
    {
        require(router.supportsCurrencyPair(bytes4(0x0e62d8ae)), "QuickUsdPriceFeed: router supports no QUICK/USDC-6");
        require(router.supportsCurrencyPair(bytes4(0x4c80cf2e)), "QuickUsdPriceFeed: router supports no USDC/USD-6");
        pairs = new bytes32[](2);
        pairs[0] = 0x0e62d8ae815597a145b33afe529040e13547b66321679408b7af666a068ef83b;
        pairs[1] = 0x4c80cf2e5b3d17b98f6f24fc78f661982b8ef656c3b75a038f7bfc6f93c1b20e;
    }

    /// @dev Derive price from given sources.
    /// @param _prices Array of last prices for each one of the currency pairs specified on constructor, 
    /// in the same order as they were specified.
    function _calculate(int256[] memory _prices)
        internal pure
        override
        returns (int256)
    {
        return (_prices[0] * _prices[1]) / 10 ** 6;
    }
}

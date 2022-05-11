// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

import "../WitnetPriceFeedRoutedCached.sol";

contract GlintUsdPriceFeed
    is
        WitnetPriceFeedRoutedCached
{    
    constructor (IWitnetPriceRouter _witnetPriceRouter)
        WitnetPriceFeedRoutedCached(_witnetPriceRouter)
    {
        require(router.supportsCurrencyPair(bytes4(0x38b57cfe)), "GlintUsdPriceFeed: router supports no GLINT/USDC-6");
        require(router.supportsCurrencyPair(bytes4(0x4c80cf2e)), "GlintUsdPriceFeed: router supports no USDC/USD-6");
        require(router.supportsCurrencyPair(bytes4(0x6d85fc1a)), "GlintUsdPriceFeed: router supports no GLINT/USDT-6");
        require(router.supportsCurrencyPair(bytes4(0x538f5a25)), "GlintUsdPriceFeed: router supports no USDT/USD-6");
        pairs = new bytes32[](4);
        pairs[0] = bytes4(0x38b57cfe);
        pairs[1] = bytes4(0x4c80cf2e);
        pairs[2] = bytes4(0x6d85fc1a);
        pairs[3] = bytes4(0x538f5a25);
    }

    /// @dev Derive price from given sources.
    /// @param _prices Array of last prices for each one of the currency pairs specified on constructor, 
    /// in the same order as they were specified.
    function _calculate(int256[] memory _prices)
        internal pure
        override
        returns (int256)
    {
        return (_prices[0] * _prices[1] + _prices[2] * _prices[3]) / 2 / 10 ** 6;
    }
}

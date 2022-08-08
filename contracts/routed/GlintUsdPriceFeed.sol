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
        pairs = new bytes32[](2);
        pairs[0] = bytes4(0x38b57cfe);
        pairs[1] = bytes4(0x4c80cf2e);
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

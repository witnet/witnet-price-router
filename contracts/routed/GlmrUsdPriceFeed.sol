// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "../WitnetPriceFeedRouted.sol";

contract GlmrUsdPriceFeed
    is
        WitnetPriceFeedRouted
{    
    constructor (IWitnetPriceRouter _witnetPriceRouter)
        WitnetPriceFeedRouted(_witnetPriceRouter)
    {
        require(
            router.supportsCurrencyPair(0xe4cc70abfc7ab1836bb8f6dd4888b8c4aa6f3ad1d445d2c9886e5ae2750e7e14),
            "GlmrUsdPriceFeed: router supports no GLMR/USDT-6"
        );
        require(
            router.supportsCurrencyPair(0x538f5a25b39995a23c24037d2d38f979c8fa7b00d001e897212d936e6f6556ef),
            "GlmrUsdPriceFeed: router supports no USDT/USD-6"
        );
        pairs = new bytes32[](2);
        pairs[0] = 0xe4cc70abfc7ab1836bb8f6dd4888b8c4aa6f3ad1d445d2c9886e5ae2750e7e14;
        pairs[1] = 0x538f5a25b39995a23c24037d2d38f979c8fa7b00d001e897212d936e6f6556ef;
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

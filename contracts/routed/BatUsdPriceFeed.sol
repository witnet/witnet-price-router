// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "../WitnetPriceFeedRouted.sol";

contract BatUsdPriceFeed
    is
        WitnetPriceFeedRouted
{    
    constructor (IWitnetPriceRouter _witnetPriceRouter)
        WitnetPriceFeedRouted(_witnetPriceRouter)
    {
        require(router.supportsCurrencyPair(bytes4(0x3b972994)), "BatUsdPriceFeed: router supports no BAT/USDT-6");
        require(router.supportsCurrencyPair(bytes4(0x538f5a25)), "BatUsdPriceFeed: router supports no USDT/USD-6");
        pairs = new bytes32[](2);
        pairs[0] = 0x3b97299445ca5f7ce46bab794aefd10e6b95345871c661eabf17d9d748ceccbe;
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

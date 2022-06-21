// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "../WitnetPriceFeedRouted.sol";

contract KlayUsdPriceFeed
    is
        WitnetPriceFeedRouted
{
    constructor (IWitnetPriceRouter _witnetPriceRouter)
        WitnetPriceFeedRouted(_witnetPriceRouter)
    {
        require(
            router.supportsCurrencyPair(0x5d9add33a579dcae4103453b8445b350aa99013a7863d73770cd7c135b2c47a0),
            "KlayUsdPriceFeed: router supports no KLAY/USDT-6"
        );
        require(
            router.supportsCurrencyPair(0x538f5a25b39995a23c24037d2d38f979c8fa7b00d001e897212d936e6f6556ef),
            "KlayUsdPriceFeed: router supports no USDT/USD-6"
        );
        pairs = new bytes32[](2);
        pairs[0] = 0x5d9add33a579dcae4103453b8445b350aa99013a7863d73770cd7c135b2c47a0;
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

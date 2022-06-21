// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "../WitnetPriceFeedRouted.sol";

contract KspUsdPriceFeed
    is
        WitnetPriceFeedRouted
{
    constructor (IWitnetPriceRouter _witnetPriceRouter)
        WitnetPriceFeedRouted(_witnetPriceRouter)
    {
        require(
            router.supportsCurrencyPair(0xa45ce226217bce73f9fae92f1582a2fbaac297b8a77d99ccfb1af9646f69eef0),
            "KspUsdPriceFeed: router supports no KSP/KRW-6"
        );
        require(
            router.supportsCurrencyPair(0x9d9af4b4c0a253e91185fdc4fc82082da388517cfbb3af3c5b1e2857783081c7),
            "KspUsdPriceFeed: router supports no KRW/USD-9"
        );
        pairs = new bytes32[](2);
        pairs[0] = 0xa45ce226217bce73f9fae92f1582a2fbaac297b8a77d99ccfb1af9646f69eef0;
        pairs[1] = 0x9d9af4b4c0a253e91185fdc4fc82082da388517cfbb3af3c5b1e2857783081c7;
    }

    /// @dev Derive price from given sources.
    /// @param _prices Array of last prices for each one of the currency pairs specified on constructor,
    /// in the same order as they were specified.
    function _calculate(int256[] memory _prices)
        internal pure
        override
        returns (int256)
    {
        return (_prices[0] * _prices[1]) / 10 ** 9;
    }
}

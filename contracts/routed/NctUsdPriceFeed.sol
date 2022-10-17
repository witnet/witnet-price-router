// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "../WitnetPriceFeedRouted.sol";

contract NctUsdPriceFeed
    is
        WitnetPriceFeedRouted
{
    constructor (IWitnetPriceRouter _witnetPriceRouter)
        WitnetPriceFeedRouted(_witnetPriceRouter)
    {
        require(
            router.supportsCurrencyPair(0x4d50c3a654d1a0e2c7fcdcccc4200d1065d8b2500f341cbc8cbbdae281101533),
            "NctCeloPriceFeed: router supports no NCT/CELO-6"
        );
        require(
            router.supportsCurrencyPair(0x9ed884be27401b98a6c3e9d830d4288c949712e57a58235927b1a00dcd487073),
            "CeloUsdPriceFeed: router supports no CELO/USD-6"
        );
        pairs = new bytes32[](2);
        pairs[0] = 0x4d50c3a654d1a0e2c7fcdcccc4200d1065d8b2500f341cbc8cbbdae281101533;
        pairs[1] = 0x9ed884be27401b98a6c3e9d830d4288c949712e57a58235927b1a00dcd487073;
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

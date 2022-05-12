import "../WitnetPriceFeedRouted.sol";

contract KusUsdPriceFeed
    is
        WitnetPriceFeedRouted
{    
    constructor (IWitnetPriceRouter _witnetPriceRouter)
        WitnetPriceFeedRouted(_witnetPriceRouter)
    {
        require(
            router.supportsCurrencyPair(0xb22a6ce26c15a95ac782a1fa89227dc699e81aa22bc1dc220e6b3842158eb263),
            "KusUsdPriceFeed: router supports no KUS/KCS-6"
        );
        require(
            router.supportsCurrencyPair(0x31debffc453c5d04a78431e7bc28098c606d2bbeea22f10a35809924a201a977),
            "KusUsdPriceFeed: router supports no KCS/USDT-6"
        );
        require(
            router.supportsCurrencyPair(0x538f5a25b39995a23c24037d2d38f979c8fa7b00d001e897212d936e6f6556ef),
            "KusUsdPriceFeed: router supports no USDT/USD-6"
        );
        pairs = new bytes32[](3); 
        pairs[0] = 0xb22a6ce26c15a95ac782a1fa89227dc699e81aa22bc1dc220e6b3842158eb263; // KUS/KCS-6
        pairs[1] = 0x31debffc453c5d04a78431e7bc28098c606d2bbeea22f10a35809924a201a977; // KCS/USDT-6
        pairs[2] = 0x538f5a25b39995a23c24037d2d38f979c8fa7b00d001e897212d936e6f6556ef; // USDT/USD-6
    }

    /// @dev Derive price from given sources.
    /// @param _price_ Array of last prices for each one of the currency pairs specified on constructor, 
    /// in the same order as they were specified.
    function _calculate(int256[] memory _price_)
        internal pure
        override
        returns (int256)
    {
        return (
            /* KUS/KCS-6  */ _price_[0]
            /* KCS/USDT-6 */   * _price_[1]
            /* USDT/USD-6 */   * _price_[2]
        ) / 10 ** 6;
    }
}

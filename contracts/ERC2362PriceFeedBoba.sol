// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;
pragma experimental ABIEncoderV2;

import "./ERC2362PriceFeed.sol";
import "witnet-solidity-bridge/contracts/interfaces/IERC20.sol";

// Your contract needs to inherit from UsingWitnet
contract ERC2362PriceFeedBoba is ERC2362PriceFeed {

    IERC20 public immutable oETH;
    uint256 public immutable oGasPrice;
    uint256 internal lastBalance;

    /// Constructor.
    /// @param _wrb WitnetRequestBoard instance, or proxy, address.
    /// @param _erc2362id Price feed denomination according to ERC2362 specs.
    /// @param _decimals Fixed number of decimals.
    /// @param _oEth ERC-20 compliant oETH address.
    constructor (
        WitnetRequestBoard _wrb,
        string memory _erc2362id,
        uint8 _decimals,
        uint256 _layer2GasPrice,
        IERC20 _oEth
      )
      ERC2362PriceFeed(_wrb, _erc2362id, _decimals)
    {
        oETH = _oEth;
        oGasPrice = _layer2GasPrice;
    }

    receive() external payable {
        revert("ERC2362PriceFeedBoba: no transfers accepted");
    }

    modifier __payableOVM {
        _;
        lastBalance = __balanceOf(address(this));
    }

    /// Gets oETH balance of given address.
    function __balanceOf(address _from)
        internal view
        returns (uint256)
    {
        return oETH.balanceOf(_from);
    }

    // ================================================================================================================
    // --- Overrides 'ERC2362PriceFeed' -------------------------------------------------------------------------------

    /// @notice Sends `request` to the WitnetRequestBoard.
    /// @dev This method will only succeed if `pending` is `false`.
    function requestUpdate()
        public payable __payableOVM
        virtual override
    {
        require(pending == false, "ERC2362PriceFeedBoba: pending update");

        // Send the request to Witnet and store the ID for later retrieval of the result:
        uint256 _value = _getMsgValue();
        uint256 _reward = _witnetEstimateReward();
        __safeTransferTo(payable(address(witnet)), _reward);
        (requestId, ) = _witnetPostRequest(this);

        // Signal that there is already a pending request
        pending = true;

        // Transfers back unused funds:
        if (_value > _reward) {
            lastBalance = _value - _reward; // avoid reentrancy attack
            _safeTransferTo(payable(msg.sender), _value - _reward);
        }
    }

    /// @notice Upgrade escrowed reward in the WRB, for currently pending request.
    /// @dev This method will only succeed if `pending` is `false`.
    function upgradeRequest()
        public payable __payableOVM
        virtual override
    {
        require(pending == true, "ERC2362PriceFeedBoba: no pending update");
        uint256 _msgValue = _getMsgValue();
        uint256 _currentReward = witnet.readRequestReward(requestId);
        uint256 _newReward = _witnetEstimateReward();
        uint256 _addedFunds;
        if (_newReward > _currentReward) {
            _addedFunds = _newReward - _currentReward;
            _safeTransferTo(payable(address(witnet)), _addedFunds);
            witnet.upgradeReward(requestId);
        }
        // Transfers back unused funds:
        lastBalance =  __balanceOf(msg.sender) + _addedFunds - _msgValue;
        _safeTransferTo(payable(msg.sender), _addedFunds - _msgValue);
    }

    // ================================================================================================================
    // --- Overrides 'Payable' ----------------------------------------------------------------------------------------

    /// Gets current transaction price.
    function _getGasPrice()
        internal view
        virtual override
        returns (uint256)
    {
        return oGasPrice;
    }

    /// @notice Calculates `msg.value` equivalent oETH value. 
    /// @dev Based on `lastBalance` value.
    function __msgValue() internal view returns (uint256) {
        uint256 _newBalance = __balanceOf(address(this));
        assert(_newBalance >= lastBalance);
        return _newBalance - lastBalance;
    }

    /// @notice Transfers oETHs to given address.
    /// @dev Updates `lastBalance` value.
    /// @param _to oETH recipient account.
    /// @param _amount Amount of oETHs to transfer.
    function __safeTransferTo(address payable _to, uint256 _amount) internal {
        uint256 _balance = __balanceOf(address(this));
        require(_amount <= _balance, "ERC2362PriceFeedBoba: insufficient funds");
        lastBalance = _balance - _amount;
        oETH.transfer(_to, _amount);
    }

}

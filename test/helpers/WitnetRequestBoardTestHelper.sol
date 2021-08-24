// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;
pragma experimental ABIEncoderV2;

import "witnet-ethereum-bridge/contracts/libs/Witnet.sol";

contract WitnetRequestBoardTestHelper {
  uint256 public requestId;

  bytes32 public drTxHash;
  bytes public cborBytes;

  function asErrorMessage(Witnet.Result memory)
    external pure
    returns (Witnet.ErrorCodes, string memory)
  {
    return (Witnet.ErrorCodes.Unknown, "mock error");
  }

  function asUint64(Witnet.Result memory) external view returns (uint64) {
    return uint64(1000 + requestId * 10);
  }

  function estimateReward(uint256 _gasPrice) external pure returns (uint256) {
    return _gasPrice * 102496;
  }


  function getQueryStatus(uint256 _queryId)
    external view
    returns (Witnet.QueryStatus)
  {
    if (_queryId == 0 || _queryId > requestId) {
      return Witnet.QueryStatus.Unknown;
    } else if (drTxHash != 0) {
      return Witnet.QueryStatus.Reported;
    } else if (_queryId == requestId) {
      return Witnet.QueryStatus.Posted;
    } else {
      return Witnet.QueryStatus.Deleted;
    }
  }

  function isOk(Witnet.Result memory _result) external pure returns (bool) {
    return _result.success;
  }

  function postRequest(IWitnetRequest) external payable returns (uint256) {
    return ++ requestId;
  }

  function reportResult(uint256 _queryId, bytes32 _drTxHash, bytes calldata _cborBytes) external {
    require(_queryId > 0 && _queryId <= requestId, "not yet posted");
    drTxHash = _drTxHash;
    cborBytes = _cborBytes;
  }

  function deleteQuery(uint256 _queryId)
    external
    returns (Witnet.Response memory _response)
  {
    require(_queryId > 0 && _queryId <= requestId, "not yet posted");
    require(drTxHash != 0, "already deleted");
    // solhint-disable not-rely-on-time  
    _response = Witnet.Response({
      reporter: address(this),
      timestamp: block.timestamp,
      drTxHash: drTxHash,
      cborBytes: cborBytes
    });
    drTxHash = 0;
    delete cborBytes;
  }    

  function resultFromCborBytes(bytes memory _cborBytes)
    external pure returns (Witnet.Result memory)
  {
    return Witnet.Result({
      success: _cborBytes.length > 0,
      value: Witnet.CBOR({
        buffer: Witnet.Buffer({
          data: _cborBytes,
          cursor: 1
        }),
        initialByte: 26,
        majorType: 0,
        additionalInformation: 26,
        len: 0,
        tag: 18446744073709551615
      })
    });
  }  
}

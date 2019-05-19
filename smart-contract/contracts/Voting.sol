pragma solidity >=0.5.2;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

contract IVerifier {

  function verifyWithdrawal(
    uint[2] memory a,
    uint[2][2] memory b,
    uint[2] memory c,
    uint[13] memory input 
    ) public returns(bool);

  function verifyDeposit(
    uint[2] memory a,
    uint[2][2] memory b,
    uint[2] memory c,
    uint[2] memory input 
    ) public returns(bool);
}

contract Voting {
  using SafeMath for uint;

  mapping(address=>mapping(uint => bool)) public burnedSalt;
  mapping(uint => bool) public utxo;

  IVerifier verifier;
  IERC20 token;

  event UtxoCreated(uint hash);
  event UtxoRemoved(uint hash);

  constructor(address _verifier, address _token) public {
    for (uint i = 1; i <= 10; i++) {
      uint hash = uint(keccak256(abi.encodePacked(i)));
      utxo[hash] = true;
      emit UtxoCreated(hash);
    }
    token = IERC20(_token);
    verifier = IVerifier(_verifier);
  }


  function withdrawal(
    uint[2] memory a,
    uint[2][2] memory b,
    uint[2] memory c,
    uint[13] memory input,  /* balance, salt, owner, all_in_hashes[10] */
    address to
  ) public returns(bool) {
    require(!burnedSalt[msg.sender][input[1]]);
    require(address(input[2]) == msg.sender);
    for (uint i=3; i<13; i++) {
      require(utxo[input[i]]);
    }
    require(verifier.verifyWithdrawal(a, b, c, input));
    burnedSalt[msg.sender][input[1]] = true;
    require(token.transfer(to, input[0]));
    return true;
  }



  function deposit(
    uint[2] memory a,
    uint[2][2] memory b,
    uint[2] memory c,
    uint[2] memory input /* balance, hash */
  ) public returns(bool) {
    require(token.transferFrom(msg.sender, address(this), input[0]));
    require(!utxo[input[1]]);
    require(verifier.verifyDeposit(a, b, c, input));
    utxo[input[1]] = true;
    emit UtxoCreated(input[1]);
    return true;
  }

}
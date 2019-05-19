pragma solidity >=0.5.2;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract VotingToken is ERC20, ERC20Detailed, Ownable {
  bool public allowMint=true;

  constructor(string memory name, string memory symbol, uint8 decimals) public ERC20Detailed(name, symbol, decimals) {
  }
  
  function mint(address to, uint value) public onlyOwner returns(bool) {
    require(allowMint);
    _mint(to, value);
    return true;
  }

  function stopMint() public onlyOwner returns(bool) {
    require(allowMint);
    allowMint = false;
    return true;
  }
}

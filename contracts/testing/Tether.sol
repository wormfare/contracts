// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Tether is ERC20, Ownable {
    constructor(address _owner) ERC20("Tether", "USDT") Ownable(_owner) {}

    function mint(address _to, uint256 _amount) public onlyOwner {
        _mint(_to, _amount);
    }

    /**
     * Tether has 6 decimals.
     */
    function decimals() public pure override returns (uint8) {
        return 6;
    }
}

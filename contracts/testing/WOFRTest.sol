// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.23;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * This is a fake WOFR contract made for testing purposes.
 */
contract WOFRTest is ERC20, Ownable {
    constructor(address _owner) ERC20("WOFR", "WOFR") Ownable(_owner) {}

    function mint(address _to, uint256 _amount) public {
        _mint(_to, _amount);
    }
}

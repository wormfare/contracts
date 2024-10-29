// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract WOFR is ERC20, ERC20Burnable, ERC20Permit {
    error InvalidOwnerAddress();

    /**
     * @dev Deploys the WOFR ERC20 token with a fixed supply of 300,000,000 tokens.
     * Mints the entire supply to the specified owner address. Includes ERC20Permit
     * for off-chain approval and ERC20Burnable for token burning functionality.
     * Reverts if the provided owner address is zero.
     *
     * @param _owner The address that will receive the entire initial supply of tokens.
     */
    constructor(
        address _owner
    ) ERC20("Wormfare", "WOFR") ERC20Permit("Wormfare") {
        if (_owner == address(0)) {
            revert InvalidOwnerAddress();
        }

        _mint(_owner, 300000000 * 10 ** decimals());
    }
}

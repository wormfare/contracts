// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract WormfareGenesis is
    Initializable,
    ERC721Upgradeable,
    ERC721URIStorageUpgradeable,
    OwnableUpgradeable
{
    uint256 totalTokens;

    /// @dev Collection minter address.
    address minter;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _owner, address _minter) public initializer {
        __ERC721_init("Wormfare Genesis", "WFG");
        __ERC721URIStorage_init();
        __Ownable_init(_owner);

        minter = _minter;
    }

    /// @dev Mint a new token.
    function batchMint(
        address _to,
        uint256[] calldata _tokenIds,
        string[] calldata _uris
    ) public {
        require(msg.sender == minter, "Invalid sender.");
        require(
            totalTokens + _tokenIds.length <= 100,
            "Unable to mint more tokens."
        );

        for (uint256 _i = 0; _i < _tokenIds.length; _i++) {
            _safeMint(_to, _tokenIds[_i]);
            _setTokenURI(_tokenIds[_i], _uris[_i]);
        }

        totalTokens += _tokenIds.length;
    }

    // The following functions are overrides required by Solidity.

    function tokenURI(
        uint256 tokenId
    )
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

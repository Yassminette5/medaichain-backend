// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PrescriptionNFT is ERC721URIStorage, Ownable {
    uint256 private _nextId = 1;

    constructor() ERC721("PrescriptionNFT", "PRX") Ownable(msg.sender) {
        // Initialize ERC721 and set Ownable owner to deployer (msg.sender)
    }

    function safeMint(address to, string memory uri) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        return tokenId;
    }

    function mint(address to, string memory uri) public onlyOwner returns (uint256) {
        return safeMint(to, uri);
    }
}
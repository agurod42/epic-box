// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Receiver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EpicBoxRedeemer is ERC721Holder, ERC1155Receiver, Ownable {
    ERC721Burnable public epicBox;
    IERC1155 public pack;

    constructor(address _epicBoxAddress, address _packAddress) {
        epicBox = ERC721Burnable(_epicBoxAddress);
        pack = IERC1155(_packAddress);
        transferOwnership(msg.sender);
    }

    function redeemTicket(uint256 ticketId, uint256 packId) external {
        // Transfer the EpicBox from the user to this contract
        epicBox.safeTransferFrom(msg.sender, address(this), ticketId);

        // Burn the EpicBox
        epicBox.burn(ticketId);

        // Transfer one unit of the pack to the user
        pack.safeTransferFrom(address(this), msg.sender, packId, 1, "");
    }

    function getPackBalance(uint256 packId) external view returns (uint256) {
        // Get the balance of packs for this contract
        return pack.balanceOf(address(this), packId);
    }

    function withdrawAllPacks(uint256 packId) external onlyOwner {
        // Get the balance of packs for this contract
        uint256 balance = pack.balanceOf(address(this), packId);

        // Transfer all packs to the owner
        pack.safeTransferFrom(address(this), owner(), packId, balance, "");
    }

    // Implement the ERC1155Receiver functions
    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes memory data
    ) public virtual override returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] memory ids,
        uint256[] memory values,
        bytes memory data
    ) public virtual override returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }
}
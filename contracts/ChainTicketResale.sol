// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @notice U Ticket 3 testnet ticket NFT with metadata, resale royalty and one-time check-in.
contract UTicket3 is ERC721, Ownable {
    struct Ticket { uint256 eventId; uint256 ticketType; uint256 orderId; bool checkedIn; }
    struct Listing { address seller; uint256 priceWei; }
    uint96 public immutable royaltyBps;
    uint256 public nextTokenId = 1;
    string private _collectionURI;
    mapping(uint256 => Ticket) public tickets;
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => string) private _ticketURIs;
    event TicketMinted(uint256 indexed tokenId, uint256 indexed eventId, uint256 indexed orderId, address owner, string metadataURI);
    event Listed(uint256 indexed tokenId, address indexed seller, uint256 priceWei);
    event Sale(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 priceWei, uint256 creatorFee);
    event CheckedIn(uint256 indexed tokenId, address indexed verifier);

    constructor(uint96 royaltyBps_, string memory collectionURI_) ERC721("U Ticket 3", "UT3") Ownable(msg.sender) {
        require(royaltyBps_ <= 1000, "fee too high");
        royaltyBps = royaltyBps_;
        _collectionURI = collectionURI_;
    }

    function mint(address to, uint256 eventId, uint256 ticketType, uint256 orderId, string calldata metadataURI) external onlyOwner returns (uint256 id) {
        id = nextTokenId++;
        _safeMint(to, id);
        tickets[id] = Ticket(eventId, ticketType, orderId, false);
        _ticketURIs[id] = metadataURI;
        emit TicketMinted(id, eventId, orderId, to, metadataURI);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "missing ticket");
        return _ticketURIs[tokenId];
    }

    function collectionURI() external view returns (string memory) { return _collectionURI; }
    function list(uint256 tokenId, uint256 priceWei) external { require(ownerOf(tokenId) == msg.sender, "not owner"); require(!tickets[tokenId].checkedIn, "used ticket"); require(priceWei > 0, "price zero"); listings[tokenId] = Listing(msg.sender, priceWei); emit Listed(tokenId, msg.sender, priceWei); }
    function cancelListing(uint256 tokenId) external { require(listings[tokenId].seller == msg.sender, "not seller"); delete listings[tokenId]; }
    function buy(uint256 tokenId) external payable { Listing memory listing = listings[tokenId]; require(listing.seller != address(0), "not listed"); require(msg.value == listing.priceWei, "wrong value"); require(!tickets[tokenId].checkedIn, "used ticket"); uint256 fee = (msg.value * royaltyBps) / 10000; delete listings[tokenId]; payable(owner()).transfer(fee); payable(listing.seller).transfer(msg.value - fee); _transfer(listing.seller, msg.sender, tokenId); emit Sale(tokenId, listing.seller, msg.sender, msg.value, fee); }
    function checkIn(uint256 tokenId) external onlyOwner { require(_ownerOf(tokenId) != address(0), "missing ticket"); require(!tickets[tokenId].checkedIn, "already used"); tickets[tokenId].checkedIn = true; delete listings[tokenId]; emit CheckedIn(tokenId, msg.sender); }
}

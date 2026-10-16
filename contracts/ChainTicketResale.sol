// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @notice U Ticket 3 testnet ticket NFT with metadata, resale royalty and one-time check-in.
contract UTicket3 is ERC721, Ownable, ReentrancyGuard {
    struct Ticket { uint256 eventId; uint256 ticketType; uint256 orderId; bool checkedIn; }
    struct Listing { address seller; uint256 priceWei; }
    struct PrimarySale { uint256 priceWei; uint256 supply; uint256 sold; }
    uint96 public immutable royaltyBps;
    uint256 public nextTokenId = 1;
    uint256 public constant MAX_PURCHASE_QUANTITY = 10;
    string private _collectionURI;
    mapping(uint256 => Ticket) public tickets;
    mapping(uint256 => uint256) public originalPriceWei;
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => mapping(uint256 => PrimarySale)) public primarySales;
    mapping(uint256 => string) private _ticketURIs;
    event TicketMinted(uint256 indexed tokenId, uint256 indexed eventId, uint256 indexed orderId, address owner, string metadataURI);
    event PrimarySaleConfigured(uint256 indexed eventId, uint256 indexed ticketType, uint256 priceWei, uint256 supply);
    event PrimaryPurchased(address indexed buyer, uint256 indexed eventId, uint256 indexed ticketType, uint256 quantity, uint256 totalPriceWei);
    event Listed(uint256 indexed tokenId, address indexed seller, uint256 priceWei);
    event Sale(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 priceWei, uint256 creatorFee);
    event CheckedIn(uint256 indexed tokenId, address indexed verifier);

    constructor(uint96 royaltyBps_, string memory collectionURI_) ERC721("U Ticket 3", "UT3") Ownable(msg.sender) {
        require(royaltyBps_ <= 1000, "fee too high");
        royaltyBps = royaltyBps_;
        _collectionURI = collectionURI_;
    }

    function mint(address to, uint256 eventId, uint256 ticketType, uint256 orderId, uint256 originalPrice, string calldata metadataURI) external onlyOwner returns (uint256 id) {
        require(originalPrice > 0, "original price zero");
        id = nextTokenId++;
        _safeMint(to, id);
        tickets[id] = Ticket(eventId, ticketType, orderId, false);
        originalPriceWei[id] = originalPrice;
        _ticketURIs[id] = metadataURI;
        emit TicketMinted(id, eventId, orderId, to, metadataURI);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "missing ticket");
        return _ticketURIs[tokenId];
    }

    function collectionURI() external view returns (string memory) { return _collectionURI; }
    function setPrimarySale(uint256 eventId, uint256 ticketType, uint256 priceWei, uint256 supply) external onlyOwner {
        require(priceWei > 0, "primary price zero");
        PrimarySale storage sale = primarySales[eventId][ticketType];
        require(supply >= sale.sold, "supply below sold");
        sale.priceWei = priceWei;
        sale.supply = supply;
        emit PrimarySaleConfigured(eventId, ticketType, priceWei, supply);
    }

    function buyPrimary(uint256 eventId, uint256 ticketType, uint256 quantity, string calldata metadataURI) external payable nonReentrant returns (uint256[] memory tokenIds) {
        PrimarySale storage sale = primarySales[eventId][ticketType];
        require(sale.priceWei > 0, "primary sale unavailable");
        require(quantity > 0 && quantity <= MAX_PURCHASE_QUANTITY, "invalid quantity");
        require(sale.sold + quantity <= sale.supply, "primary sale sold out");
        uint256 totalPrice = sale.priceWei * quantity;
        require(msg.value == totalPrice, "wrong primary value");

        sale.sold += quantity;
        tokenIds = new uint256[](quantity);
        for (uint256 i; i < quantity; ++i) {
            uint256 tokenId = nextTokenId++;
            _safeMint(msg.sender, tokenId);
            tickets[tokenId] = Ticket(eventId, ticketType, 0, false);
            originalPriceWei[tokenId] = sale.priceWei;
            _ticketURIs[tokenId] = metadataURI;
            tokenIds[i] = tokenId;
            emit TicketMinted(tokenId, eventId, 0, msg.sender, metadataURI);
        }

        (bool paid,) = payable(owner()).call{value: totalPrice}("");
        require(paid, "primary payment failed");
        emit PrimaryPurchased(msg.sender, eventId, ticketType, quantity, totalPrice);
    }

    function maxResalePrice(uint256 tokenId) public view returns (uint256) { return originalPriceWei[tokenId] + ((originalPriceWei[tokenId] * 1000) / 10000); }
    function list(uint256 tokenId, uint256 priceWei) external { require(ownerOf(tokenId) == msg.sender, "not owner"); require(!tickets[tokenId].checkedIn, "used ticket"); require(priceWei > 0, "price zero"); require(priceWei <= maxResalePrice(tokenId), "resale price exceeds 10 percent cap"); listings[tokenId] = Listing(msg.sender, priceWei); emit Listed(tokenId, msg.sender, priceWei); }
    function cancelListing(uint256 tokenId) external { require(listings[tokenId].seller == msg.sender, "not seller"); delete listings[tokenId]; }
    function buy(uint256 tokenId) external payable nonReentrant { Listing memory listing = listings[tokenId]; require(listing.seller != address(0), "not listed"); require(listing.seller != msg.sender, "seller cannot buy"); require(msg.value == listing.priceWei, "wrong value"); require(!tickets[tokenId].checkedIn, "used ticket"); require(ownerOf(tokenId) == listing.seller, "seller not owner"); uint256 fee = (msg.value * royaltyBps) / 10000; delete listings[tokenId]; _transfer(listing.seller, msg.sender, tokenId); (bool feePaid,) = payable(owner()).call{value: fee}(""); require(feePaid, "royalty transfer failed"); (bool sellerPaid,) = payable(listing.seller).call{value: msg.value - fee}(""); require(sellerPaid, "seller transfer failed"); emit Sale(tokenId, listing.seller, msg.sender, msg.value, fee); }
    function checkIn(uint256 tokenId) external onlyOwner { require(_ownerOf(tokenId) != address(0), "missing ticket"); require(!tickets[tokenId].checkedIn, "already used"); tickets[tokenId].checkedIn = true; delete listings[tokenId]; emit CheckedIn(tokenId, msg.sender); }
}

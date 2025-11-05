// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ProductNFT is ERC721URIStorage, ReentrancyGuard, Ownable {
    uint256 private _tokenIdCounter;
    IERC20 public ldToken;

    struct Order {
        address buyer;
        address seller;
        uint256 price;
        string otp;
        bool confirmed;
        bool nftTransferred;
    }

    mapping(uint256 => Order) public orders;

    event NFTMinted(uint256 indexed tokenId, address indexed owner, string tokenURI);
    event OrderCreated(uint256 indexed tokenId, address indexed buyer, address indexed seller, uint256 price);
    event OrderDelivered(uint256 indexed tokenId, address indexed buyer, address indexed seller);
    event OrderRejected(uint256 indexed tokenId, address indexed buyer);
    event TokensTransferred(address indexed from, address indexed to, uint256 amount);

    constructor(address _ldTokenAddress) ERC721("ProductNFT", "LD") {
        _tokenIdCounter = 0;
        ldToken = IERC20(_ldTokenAddress);
    }

    // Mint NFT to `to` address
    function mintNFT(address to, string memory tokenURI) external returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);

        // Give approval to contract to move this NFT
        _approve(address(this), tokenId);

        emit NFTMinted(tokenId, to, tokenURI);
        return tokenId;
    }

    // Buyer creates an order and locks funds in contract
    function createOrder(uint256 tokenId, uint256 price, string memory otp) external {
        require(price > 0, "Price must be > 0");
        require(_exists(tokenId), "Invalid token");
        require(ownerOf(tokenId) != msg.sender, "You already own this NFT");

        address seller = ownerOf(tokenId);
        require(ldToken.transferFrom(msg.sender, address(this), price), "Token transfer failed");

        orders[tokenId] = Order({
            buyer: msg.sender,
            seller: seller,
            price: price,
            otp: otp,
            confirmed: false,
            nftTransferred: false
        });

        emit OrderCreated(tokenId, msg.sender, seller, price);
    }

    // Buyer confirms delivery using OTP; ETH goes to seller, NFT goes to buyer
    function markAsDelivered(uint256 tokenId, string memory inputOTP) external nonReentrant {
        Order storage order = orders[tokenId];
        require(order.buyer == msg.sender, "Only buyer can confirm");
        require(!order.confirmed, "Already confirmed");
        require(
            keccak256(abi.encodePacked(order.otp)) == keccak256(abi.encodePacked(inputOTP)),
            "Invalid OTP"
        );

        order.confirmed = true;
        require(ldToken.transfer(order.seller, order.price), "Token payout failed");
        _transfer(order.seller, order.buyer, tokenId);
        order.nftTransferred = true;

        emit OrderDelivered(tokenId, order.buyer, order.seller);
    }


    function getOrder(uint256 tokenId) public view returns (Order memory) {
        return orders[tokenId];
    }

    function rejectOrder(uint256 tokenId) external nonReentrant {
        Order storage order = orders[tokenId];
        require(order.seller == msg.sender, "Only seller can reject");
        require(!order.confirmed, "Order already confirmed");

        address buyer = order.buyer;
        uint256 amount = order.price;

        delete orders[tokenId];
        require(ldToken.transfer(buyer, amount), "Refund failed");

        emit OrderRejected(tokenId, buyer);
    }

    // Admin transfers tokens to user (for approved top-up)
    function transferTokens(address to, uint256 amount) external onlyOwner {
        require(ldToken.balanceOf(address(this)) >= amount, "Insufficient token balance");
        require(ldToken.transfer(to, amount), "Token transfer failed");
        emit TokensTransferred(address(this), to, amount);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title BurgerRewards
 * @dev ERC721 NFT contract for rewarding users who find waste bins
 */
contract BurgerRewards is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    // Mapping to track how many bins each user has found
    mapping(address => uint256) public binsFoundByUser;
    
    // Mapping to track which badges a user has earned
    mapping(address => mapping(string => bool)) public badgesEarned;
    
    // Metadata URIs for different reward types
    string public constant MYNTRA_COUPON_URI = "https://bintrack.com/api/metadata/myntra-coupon.json";
    string public constant ZOMATO_COUPON_URI = "https://bintrack.com/api/metadata/zomato-coupon.json";
    string public constant BIN_HUNTER_BADGE_URI = "https://bintrack.com/api/metadata/bin-hunter-badge.json";
    string public constant BURGER_OS_BADGE_URI = "https://bintrack.com/api/metadata/burger-os-badge.json";
    
    // Events
    event BinReported(address indexed user, uint256 totalBinsFound);
    event NFTRewarded(address indexed user, uint256 tokenId, string rewardType);
    
    constructor() ERC721("Burger", "BRG") Ownable(msg.sender) {}
    
    /**
     * @dev Report a new bin and potentially earn rewards
     * @return tokenId of the minted NFT reward (0 if no reward was given)
     */
    function reportBin(address user) external onlyOwner returns (uint256) {
        // Increase the user's bin count
        binsFoundByUser[user]++;
        
        emit BinReported(user, binsFoundByUser[user]);
        
        // Award appropriate rewards based on bin count
        return _processRewards(user);
    }
    
    /**
     * @dev Process rewards based on user's bin count
     * @param user Address of the user to reward
     * @return tokenId of the minted NFT reward (0 if no reward was given)
     */
    function _processRewards(address user) internal returns (uint256) {
        uint256 binCount = binsFoundByUser[user];
        
        // For every bin found, alternate between Myntra and Zomato coupons
        if (binCount > 0) {
            string memory couponURI;
            string memory rewardType;
            
            if (binCount % 2 == 1) {
                // Odd bin counts get Myntra coupon
                couponURI = MYNTRA_COUPON_URI;
                rewardType = "MYNTRA_COUPON";
            } else {
                // Even bin counts get Zomato coupon
                couponURI = ZOMATO_COUPON_URI;
                rewardType = "ZOMATO_COUPON";
            }
            
            uint256 tokenId = _mintNFT(user, couponURI);
            emit NFTRewarded(user, tokenId, rewardType);
            
            // Check if user has reached the badge threshold (15 bins)
            if (binCount == 15 && !badgesEarned[user]["BIN_HUNTER"]) {
                badgesEarned[user]["BIN_HUNTER"] = true;
                uint256 badgeTokenId = _mintNFT(user, BIN_HUNTER_BADGE_URI);
                emit NFTRewarded(user, badgeTokenId, "BIN_HUNTER_BADGE");
            }
            
            // Another milestone for the Burger OS badge (could be another count or special condition)
            if (binCount == 30 && !badgesEarned[user]["BURGER_OS"]) {
                badgesEarned[user]["BURGER_OS"] = true;
                uint256 badgeTokenId = _mintNFT(user, BURGER_OS_BADGE_URI);
                emit NFTRewarded(user, badgeTokenId, "BURGER_OS_BADGE");
            }
            
            return tokenId;
        }
        
        return 0;
    }
    
    /**
     * @dev Internal function to mint a new NFT
     * @param recipient Address receiving the NFT
     * @param tokenURI URI for the token metadata
     * @return tokenId of the new NFT
     */
    function _mintNFT(address recipient, string memory tokenURI) internal returns (uint256) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        _safeMint(recipient, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        
        return newTokenId;
    }
    
    /**
     * @dev Allow admins to manually reward a user
     * @param recipient Address receiving the NFT
     * @param tokenURI URI for the token metadata
     * @param rewardType Type of reward being given
     * @return tokenId of the new NFT
     */
    function manualReward(address recipient, string memory tokenURI, string memory rewardType) 
        external 
        onlyOwner 
        returns (uint256) 
    {
        uint256 tokenId = _mintNFT(recipient, tokenURI);
        emit NFTRewarded(recipient, tokenId, rewardType);
        return tokenId;
    }
    
    /**
     * @dev Get the total number of bins found by a user
     * @param user Address of the user
     * @return Number of bins found
     */
    function getBinsFoundByUser(address user) external view returns (uint256) {
        return binsFoundByUser[user];
    }
    
    /**
     * @dev Check if a user has earned a specific badge
     * @param user Address of the user
     * @param badgeType Type of badge to check for
     * @return Whether user has earned the badge
     */
    function hasBadge(address user, string memory badgeType) external view returns (bool) {
        return badgesEarned[user][badgeType];
    }
}
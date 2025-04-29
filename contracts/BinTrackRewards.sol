// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BinTrackRewards is ERC721URIStorage, Ownable {
    // Replace Counters with a simple uint256
    uint256 private _nextTokenId;
    
    // Constants for NFT types
    uint8 public constant COUPON_TYPE = 1;
    uint8 public constant BADGE_TYPE = 2;
    
    // Track bin count per user
    mapping(address => uint256) public userBinCount;
    
    // Track which rewards each user has received
    mapping(address => bool) public receivedCoupon;
    mapping(address => bool) public receivedBadge;
    
    // NFT metadata URIs - updated with your Pinata CIDs
    string public couponURI = "ipfs://QmRYJ2v7KtCfx4PCMaKNjib5NeHUtqw5XYZUWsBUGZrfxw";
    string public badgeURI = "ipfs://QmTHmYYDtSBkoEW7nfwonk7yND7s3uxLqtczSHRZznMpxr";
    
    // NFT type for each token
    mapping(uint256 => uint8) public nftTypes;
    
    // Events
    event BinCountUpdated(address indexed user, uint256 newCount);
    event RewardMinted(address indexed user, uint256 tokenId, uint8 rewardType);

    constructor(address initialOwner) ERC721("BinTrack Rewards", "BTR") Ownable(initialOwner) {}

    /**
     * Record a new bin found by a user and automatically issue rewards if eligible
     * @param user Address of the user who found the bin
     */
    function recordBinFound(address user) public onlyOwner {
        // Increment bin count for the user
        userBinCount[user]++;
        
        // Check for rewards eligibility
        checkAndIssueRewards(user);
        
        emit BinCountUpdated(user, userBinCount[user]);
    }
    
    /**
     * Record multiple bins found by a user
     * @param user Address of the user
     * @param count Number of bins to add
     */
    function recordMultipleBinsFound(address user, uint256 count) public onlyOwner {
        userBinCount[user] += count;
        
        // Check for rewards eligibility
        checkAndIssueRewards(user);
        
        emit BinCountUpdated(user, userBinCount[user]);
    }
    
    /**
     * Check if user is eligible for rewards and issue them
     * @param user User address to check and reward
     */
    function checkAndIssueRewards(address user) private {
        // If user has found 1 bin and hasn't received a coupon yet
        if (userBinCount[user] >= 1 && !receivedCoupon[user]) {
            mintCoupon(user);
        }
        
        // If user has found 15 bins and hasn't received a badge yet
        if (userBinCount[user] >= 15 && !receivedBadge[user]) {
            mintBadge(user);
        }
    }
    
    /**
     * Mint a coupon NFT to a user
     * @param to Address to receive the coupon
     * @return tokenId of the minted NFT
     */
    function mintCoupon(address to) private returns (uint256) {
        // Use direct increment pattern instead of Counters
        uint256 tokenId = _nextTokenId++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, couponURI);
        
        // Mark NFT type and record that user received coupon
        nftTypes[tokenId] = COUPON_TYPE;
        receivedCoupon[to] = true;
        
        emit RewardMinted(to, tokenId, COUPON_TYPE);
        
        return tokenId;
    }
    
    /**
     * Mint a badge NFT to a user
     * @param to Address to receive the badge
     * @return tokenId of the minted NFT
     */
    function mintBadge(address to) private returns (uint256) {
        // Use direct increment pattern instead of Counters
        uint256 tokenId = _nextTokenId++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, badgeURI);
        
        // Mark NFT type and record that user received badge
        nftTypes[tokenId] = BADGE_TYPE;
        receivedBadge[to] = true;
        
        emit RewardMinted(to, tokenId, BADGE_TYPE);
        
        return tokenId;
    }
    
    /**
     * Update the metadata URI for coupons
     * @param newURI New IPFS URI for coupon metadata
     */
    function updateCouponURI(string memory newURI) public onlyOwner {
        couponURI = newURI;
    }
    
    /**
     * Update the metadata URI for badges
     * @param newURI New IPFS URI for badge metadata
     */
    function updateBadgeURI(string memory newURI) public onlyOwner {
        badgeURI = newURI;
    }
    
    /**
     * Get a user's current bin count
     * @param user Address to check
     * @return Number of bins found by the user
     */
    function getBinCount(address user) public view returns (uint256) {
        return userBinCount[user];
    }
    
    /**
     * Check if a user has received a coupon
     * @param user Address to check
     * @return True if the user has received a coupon
     */
    function hasCoupon(address user) public view returns (bool) {
        return receivedCoupon[user];
    }
    
    /**
     * Check if a user has received a badge
     * @param user Address to check
     * @return True if the user has received a badge
     */
    function hasBadge(address user) public view returns (bool) {
        return receivedBadge[user];
    }
    
    /**
     * Manually force reward check for a user
     * @param user Address to check for rewards
     */
    function forceRewardCheck(address user) public onlyOwner {
        checkAndIssueRewards(user);
    }
    
    /**
     * Reset a user's rewards status (for testing or admin purposes)
     * @param user Address to reset
     */
    function resetRewardStatus(address user) public onlyOwner {
        receivedCoupon[user] = false;
        receivedBadge[user] = false;
    }
    
    /**
     * Manually set a user's bin count (for admin purposes)
     * @param user Address to update
     * @param count New bin count
     */
    function setUserBinCount(address user, uint256 count) public onlyOwner {
        userBinCount[user] = count;
        emit BinCountUpdated(user, count);
    }
}
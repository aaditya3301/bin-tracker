const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Pinata credentials
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;

// Folder paths
const IMAGES_DIR = path.join(__dirname, '../nft-assets/images');
const METADATA_DIR = path.join(__dirname, '../nft-assets/metadata');

// Check if directories exist, if not create them
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
};

ensureDirectoryExists(path.join(IMAGES_DIR, 'coupons'));
ensureDirectoryExists(path.join(IMAGES_DIR, 'badges'));
ensureDirectoryExists(path.join(METADATA_DIR, 'coupons'));
ensureDirectoryExists(path.join(METADATA_DIR, 'badges'));

// Function to upload a file to Pinata
const uploadFileToPinata = async (filePath, fileName) => {
  try {
    const url = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
    
    let data = new FormData();
    data.append('file', fs.createReadStream(filePath));
    
    const metadata = JSON.stringify({
      name: fileName,
    });
    data.append('pinataMetadata', metadata);
    
    const response = await axios.post(url, data, {
      maxBodyLength: 'Infinity', // This is needed to prevent axios from erroring out with large files
      headers: {
        'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_API_KEY
      }
    });

    return response.data.IpfsHash;
  } catch (error) {
    console.error(`Error uploading file ${fileName}:`, error);
    throw error;
  }
};

// Function to upload NFT image and get its CID
const uploadNFTImage = async (imageName, type) => {
  const subfolder = type === 'coupon' ? 'coupons' : 'badges';
  const imagePath = path.join(IMAGES_DIR, subfolder, `${imageName}.png`);
  
  // Check if file exists
  if (!fs.existsSync(imagePath)) {
    console.error(`Image file not found: ${imagePath}`);
    return null;
  }
  
  console.log(`Uploading ${type} image: ${imageName}...`);
  const imageCID = await uploadFileToPinata(imagePath, `${imageName}.png`);
  console.log(`  --> ${imageName}.png uploaded with CID: ${imageCID}`);
  return imageCID;
};

// Function to create and upload metadata
const createAndUploadMetadata = async (name, type, imageCID, details) => {
  const subfolder = type === 'coupon' ? 'coupons' : 'badges';
  const metadataPath = path.join(METADATA_DIR, subfolder, `${name}.json`);
  
  // Create metadata JSON
  const metadata = {
    name: details.name,
    description: details.description,
    image: `ipfs://${imageCID}`, 
    external_url: "https://bintrack.app/rewards",
    attributes: details.attributes
  };
  
  // Write metadata to file
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  
  // Upload metadata to Pinata
  console.log(`Uploading ${type} metadata: ${name}...`);
  const metadataCID = await uploadFileToPinata(metadataPath, `${name}.json`);
  console.log(`  --> ${name}.json uploaded with CID: ${metadataCID}`);
  return metadataCID;
};

// Main execution function
const main = async () => {
  try {
    // Check if credentials are set
    if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
      throw new Error('Pinata API credentials not found in .env file');
    }

    // NFT details
    const nfts = {
      coupons: {
        'zomato-coupon': {
          name: "Zomato 15% Discount Coupon",
          description: "This exclusive BinTrack NFT coupon gives you 15% off on your next Zomato order. Earned by contributing to cleaner communities through bin tracking.",
          attributes: [
            { trait_type: "Reward Type", value: "Coupon" },
            { trait_type: "Partner", value: "Zomato" },
            { trait_type: "Discount", value: "15%" },
            { trait_type: "Bins Required", value: "1" },
            { display_type: "date", trait_type: "Expiration Date", value: 1767225600 }
          ]
        },
        'myntra-coupon': {
          name: "Myntra 10% Discount Coupon",
          description: "This exclusive BinTrack NFT coupon gives you 10% off on your next Myntra purchase. Earned by contributing to cleaner communities through bin tracking.",
          attributes: [
            { trait_type: "Reward Type", value: "Coupon" },
            { trait_type: "Partner", value: "Myntra" },
            { trait_type: "Discount", value: "10%" },
            { trait_type: "Bins Required", value: "5" },
            { display_type: "date", trait_type: "Expiration Date", value: 1767225600 }
          ]
        }
      },
      badges: {
        'bin-hunter-badge': {
          name: "Bin Hunter Badge",
          description: "This prestigious BinTrack badge recognizes your commitment to finding and reporting waste bins in your community. Awarded for discovering 10 waste bins.",
          attributes: [
            { trait_type: "Reward Type", value: "Badge" },
            { trait_type: "Badge Name", value: "Bin Hunter" },
            { trait_type: "Rarity", value: "Rare" },
            { trait_type: "Bins Required", value: "10" },
            { trait_type: "Achievement", value: "Located 10 waste bins" },
            { trait_type: "Rank", value: "Silver" }
          ]
        },
        'community-hero-badge': {
          name: "Community Hero Badge",
          description: "This prestigious BinTrack badge celebrates your exceptional dedication to waste management in your community. As a Community Hero, you've made a significant positive impact on local cleanliness and sustainability.",
          attributes: [
            { trait_type: "Reward Type", value: "Badge" },
            { trait_type: "Badge Name", value: "Community Hero" },
            { trait_type: "Rarity", value: "Legendary" },
            { trait_type: "Bins Required", value: "15" },
            { trait_type: "Achievement", value: "Located 15 waste bins" },
            { trait_type: "Rank", value: "Gold" }
          ]
        }
      }
    };

    // Upload and track all NFTs
    const uploadedNFTs = {
      coupons: {},
      badges: {}
    };

    // If files don't exist yet, display instructions
    if (!fs.existsSync(path.join(IMAGES_DIR, 'coupons', 'zomato-coupon.png'))) {
      console.log("\n⚠️ NFT image files not found. Please create the following image files first:");
      console.log(`- ${path.join(IMAGES_DIR, 'coupons', 'zomato-coupon.png')}`);
      console.log(`- ${path.join(IMAGES_DIR, 'coupons', 'myntra-coupon.png')}`);
      console.log(`- ${path.join(IMAGES_DIR, 'badges', 'bin-hunter-badge.png')}`);
      console.log(`- ${path.join(IMAGES_DIR, 'badges', 'community-hero-badge.png')}`);
      console.log("\nAfter creating these files, run this script again.");
      return;
    }

    console.log("Starting NFT upload process...\n");

    // Upload coupons
    for (const [couponId, details] of Object.entries(nfts.coupons)) {
      const imageCID = await uploadNFTImage(couponId, 'coupon');
      const metadataCID = await createAndUploadMetadata(couponId, 'coupon', imageCID, details);
      uploadedNFTs.coupons[couponId] = { imageCID, metadataCID };
    }

    // Upload badges
    for (const [badgeId, details] of Object.entries(nfts.badges)) {
      const imageCID = await uploadNFTImage(badgeId, 'badge');
      const metadataCID = await createAndUploadMetadata(badgeId, 'badge', imageCID, details);
      uploadedNFTs.badges[badgeId] = { imageCID, metadataCID };
    }

    // Output summary
    console.log("\n✅ Upload Complete! 🎉");
    console.log("-----------------------------------------");
    console.log("Zomato Coupon:");
    console.log(`  Image: ipfs://${uploadedNFTs.coupons['zomato-coupon'].imageCID}`);
    console.log(`  Metadata: ipfs://${uploadedNFTs.coupons['zomato-coupon'].metadataCID}`);
    console.log(`  View: https://gateway.pinata.cloud/ipfs/${uploadedNFTs.coupons['zomato-coupon'].metadataCID}`);

    console.log("\nMyntra Coupon:");
    console.log(`  Image: ipfs://${uploadedNFTs.coupons['myntra-coupon'].imageCID}`);
    console.log(`  Metadata: ipfs://${uploadedNFTs.coupons['myntra-coupon'].metadataCID}`);
    console.log(`  View: https://gateway.pinata.cloud/ipfs/${uploadedNFTs.coupons['myntra-coupon'].metadataCID}`);

    console.log("\nBin Hunter Badge:");
    console.log(`  Image: ipfs://${uploadedNFTs.badges['bin-hunter-badge'].imageCID}`);
    console.log(`  Metadata: ipfs://${uploadedNFTs.badges['bin-hunter-badge'].metadataCID}`);
    console.log(`  View: https://gateway.pinata.cloud/ipfs/${uploadedNFTs.badges['bin-hunter-badge'].metadataCID}`);

    console.log("\nCommunity Hero Badge:");
    console.log(`  Image: ipfs://${uploadedNFTs.badges['community-hero-badge'].imageCID}`);
    console.log(`  Metadata: ipfs://${uploadedNFTs.badges['community-hero-badge'].metadataCID}`);
    console.log(`  View: https://gateway.pinata.cloud/ipfs/${uploadedNFTs.badges['community-hero-badge'].metadataCID}`);

    console.log("\n-----------------------------------------");
    console.log("Update your smart contract with:");
    console.log(`couponURI = "ipfs://${uploadedNFTs.coupons['zomato-coupon'].metadataCID}";`);
    console.log(`badgeURI = "ipfs://${uploadedNFTs.badges['bin-hunter-badge'].metadataCID}";`);

    // Save results to a file for reference
    const resultsPath = path.join(__dirname, '../nft-assets/upload-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(uploadedNFTs, null, 2));
    console.log(`\nResults saved to ${resultsPath}`);

  } catch (error) {
    console.error("Error in upload process:", error.message);
  }
};

// Run the main function
main();
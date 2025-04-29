const { ethers } = require("hardhat");

async function main() {
  // Get contract factory and signer
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy BinTrackRewards contract
  const BinTrackRewards = await ethers.getContractFactory("BinTrackRewards");
  const binTrackRewards = await BinTrackRewards.deploy(deployer.address);
  
  // Wait for deployment to finish
  await binTrackRewards.waitForDeployment();
  const contractAddress = await binTrackRewards.getAddress();
  
  console.log("BinTrackRewards deployed to:", contractAddress);
  
  // The metadata URIs are already set in the contract constructor,
  // but you could update them here if needed:
  // await binTrackRewards.updateCouponURI("ipfs://QmRYJ2v7KtCfx4PCMaKNjib5NeHUtqw5XYZUWsBUGZrfxw");
  // await binTrackRewards.updateBadgeURI("ipfs://QmTHmYYDtSBkoEW7nfwonk7yND7s3uxLqtczSHRZznMpxr");
  
  // Save deployment info to a file
  const fs = require("fs");
  const deploymentInfo = {
    contract: "BinTrackRewards",
    address: contractAddress,
    network: network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    coupons: {
      zomato: "ipfs://QmRYJ2v7KtCfx4PCMaKNjib5NeHUtqw5XYZUWsBUGZrfxw",
      myntra: "ipfs://QmPs1sN5AaGLsuxSU6HPFbUGDb4DZMiZyBQJzXhcYc5xTE"
    },
    badges: {
      binHunter: "ipfs://QmTHmYYDtSBkoEW7nfwonk7yND7s3uxLqtczSHRZznMpxr",
      communityHero: "ipfs://QmXsv5EHsxuS2fQ8PcBsL63ZaqFZ1tpBC5zyoCcLABCDUP"
    }
  };
  
  // Create deployments directory if it doesn't exist
  if (!fs.existsSync("./deployments")) {
    fs.mkdirSync("./deployments");
  }
  
  fs.writeFileSync(
    `./deployments/${network.name}-deployment.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log(`Deployment info saved to ./deployments/${network.name}-deployment.json`);
  
  // For verification purposes, print out the command to verify
  console.log("\nTo verify the contract on Etherscan, run:");
  console.log(`npx hardhat verify --network ${network.name} ${contractAddress} ${deployer.address}`);
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
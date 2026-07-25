const { ethers } = require("hardhat");

async function main() {
  const Crowdfunding = await ethers.getContractFactory("Crowdfunding");

  const contract = await Crowdfunding.deploy();

  await contract.deployed(); // ✅ ethers v5

  console.log("✅ Contract deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});